use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};
use std::error::Error;
use std::fs::File;
use std::io::{BufReader, Write};
use std::path::Path;
use tempfile::NamedTempFile;

type Map<T> = BTreeMap<String, T>;
type Strings = BTreeSet<String>;

#[derive(Deserialize)]
struct SourceService {
    prefix: String,
    service_authorization_url: String,
    resources: Map<SourceResource>,
    privileges: Map<SourceAction>,
}

#[derive(Deserialize)]
struct SourceResource {
    arn: String,
    condition_keys: Strings,
}

#[derive(Deserialize)]
struct SourceAction {
    access_level: Level,
    resource_types: Map<Link>,
}

#[derive(Serialize, Deserialize)]
enum Level {
    List,
    Read,
    Write,
    Tagging,
    #[serde(rename = "Permissions management")]
    PermissionsManagement,
}

#[derive(Serialize, Deserialize)]
struct Link {
    #[serde(skip_serializing_if = "std::ops::Not::not")]
    required: bool,
    #[serde(
        rename(deserialize = "condition_keys", serialize = "conditions"),
        skip_serializing_if = "Strings::is_empty"
    )]
    conditions: Strings,
    #[serde(
        rename(deserialize = "dependent_actions", serialize = "dependencies"),
        skip_serializing_if = "Strings::is_empty"
    )]
    dependencies: Strings,
}

#[derive(Serialize)]
struct Resource {
    arn: Option<String>,
    #[serde(skip_serializing_if = "Strings::is_empty")]
    conditions: Strings,
}

#[derive(Serialize)]
struct Action {
    level: Level,
    resources: Map<Link>,
    #[serde(skip_serializing_if = "Strings::is_empty")]
    conditions: Strings,
    #[serde(skip_serializing_if = "Strings::is_empty")]
    dependencies: Strings,
}

// One line per entity keeps snapshot diffs reviewable without repeating names or ARN formats.
fn write_map<T: Serialize>(out: &mut impl Write, entries: Map<T>) -> Result<(), Box<dyn Error>> {
    write!(out, "{{")?;
    for (i, (key, value)) in entries.into_iter().enumerate() {
        if i > 0 {
            write!(out, ",")?;
        }
        write!(out, "\n      {}: ", serde_json::to_string(&key)?)?;
        serde_json::to_writer(&mut *out, &value)?;
    }
    write!(out, "\n    }}")?;
    Ok(())
}

fn compile(input: &Path, output: &Path) -> Result<(), Box<dyn Error>> {
    let mut entries: Map<serde_json::Value> =
        serde_json::from_reader(BufReader::new(File::open(input)?))?;
    if let Some(version) = entries.remove("policy_sentry_schema_version") {
        if version != "v2" {
            return Err(format!("Unsupported Policy Sentry schema: {version}").into());
        }
    }
    if entries.is_empty() {
        return Err("Definition contains no services".into());
    }
    let parent = output
        .parent()
        .filter(|p| !p.as_os_str().is_empty())
        .unwrap_or(Path::new("."));
    std::fs::create_dir_all(parent)?;
    let mut pending = NamedTempFile::new_in(parent)?;
    let mut out = std::io::BufWriter::new(pending.as_file_mut());
    writeln!(out, "{{")?;
    let mut services = 0;
    let mut actions = 0;
    for (prefix, raw) in entries {
        let service: SourceService = serde_json::from_value(raw)
            .map_err(|e| format!("Invalid definition for {prefix}: {e}"))?;
        if service.prefix != prefix || service.privileges.is_empty() {
            return Err(format!("Missing actions or inconsistent prefix for {prefix}").into());
        }
        if services > 0 {
            writeln!(out, ",")?;
        }
        services += 1;
        writeln!(out, "  {}: {{", serde_json::to_string(&prefix)?)?;
        writeln!(
            out,
            "    \"reference\": {},",
            serde_json::to_string(&service.service_authorization_url)?
        )?;
        write!(out, "    \"resources\": ")?;
        let mut resources: Map<Resource> = service
            .resources
            .into_iter()
            .map(|(name, resource)| {
                (
                    name,
                    Resource {
                        arn: Some(resource.arn),
                        conditions: resource.condition_keys,
                    },
                )
            })
            .collect();
        // Some upstream action tables name a type missing from the service's ARN table.
        // Keep it discoverable; the policy builder can only validate declared ARN formats.
        for action in service.privileges.values() {
            for name in action.resource_types.keys().filter(|name| !name.is_empty()) {
                resources.entry(name.clone()).or_insert_with(|| Resource {
                    arn: None,
                    conditions: Strings::new(),
                });
            }
        }
        write_map(&mut out, resources)?;
        write!(out, ",\n    \"actions\": ")?;
        actions += service.privileges.len();
        write_map(
            &mut out,
            service
                .privileges
                .into_iter()
                .map(|(name, mut a)| {
                    // The empty resource key carries action-wide metadata, including for unscopable actions.
                    let common = a.resource_types.remove("");
                    let (conditions, dependencies) = common
                        .map(|link| (link.conditions, link.dependencies))
                        .unwrap_or_default();
                    (
                        name,
                        Action {
                            level: a.access_level,
                            resources: a.resource_types,
                            conditions,
                            dependencies,
                        },
                    )
                })
                .collect(),
        )?;
        write!(out, "\n  }}")?;
    }
    writeln!(out, "\n}}")?;
    out.flush()?;
    drop(out);
    pending.persist(output)?;
    eprintln!("Compiled {services} services and {actions} actions.");
    Ok(())
}

fn main() -> Result<(), Box<dyn Error>> {
    let args: Vec<_> = std::env::args_os().skip(1).collect();
    if args.len() != 2 {
        return Err("Usage: iam-catalog INPUT.json OUTPUT.json".into());
    }
    compile(Path::new(&args[0]), Path::new(&args[1]))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn fixture() -> serde_json::Value {
        json!({
            "my-service": {
                "prefix": "my-service", "service_authorization_url": "https://example.org",
                "resources": {"item": {"arn": "arn:${Partition}:my-service:${Region}:${Account}:item/${Id}", "condition_keys": ["item:key"]}},
                "privileges": {"CreateItem": {"access_level": "Write", "resource_types": {
                    "": {"required": false, "condition_keys": ["global:key"], "dependent_actions": ["other:Global"]},
                    "item": {"required": true, "condition_keys": ["edge:key"], "dependent_actions": ["other:Local"]},
                    "missing-type": {"required": false, "condition_keys": [], "dependent_actions": []}
                }}}
            }
        })
    }

    #[test]
    fn preserves_each_relationship_and_accepts_both_source_versions() {
        let temp = tempfile::tempdir().unwrap();
        let source = temp.path().join("input.json");
        let output = temp.path().join("catalog.json");
        let mut input = fixture();
        std::fs::write(&source, input.to_string()).unwrap();
        compile(&source, &output).unwrap();
        let legacy = std::fs::read(&output).unwrap();
        input["policy_sentry_schema_version"] = json!("v2");
        std::fs::write(&source, input.to_string()).unwrap();
        compile(&source, &output).unwrap();
        assert_eq!(std::fs::read(&output).unwrap(), legacy);
        let catalog: serde_json::Value = serde_json::from_slice(&legacy).unwrap();
        let service = &catalog["my-service"];
        assert_eq!(service["resources"]["missing-type"], json!({"arn": null}));
        let action = &service["actions"]["CreateItem"];
        assert_eq!(action["conditions"], json!(["global:key"]));
        assert_eq!(action["dependencies"], json!(["other:Global"]));
        assert_eq!(
            action["resources"]["item"],
            json!({"required": true, "conditions": ["edge:key"], "dependencies": ["other:Local"]})
        );
        assert_eq!(action["resources"]["missing-type"], json!({}));
    }

    #[test]
    fn invalid_refresh_preserves_previous_output() {
        let temp = tempfile::tempdir().unwrap();
        let source = temp.path().join("input.json");
        let output = temp.path().join("catalog.json");
        std::fs::write(&output, "previous").unwrap();
        let mut invalid = fixture();
        invalid["my-service"]["privileges"]["CreateItem"]["access_level"] = json!("Unknown");
        for input in [
            invalid,
            json!({"policy_sentry_schema_version": "v99"}),
            json!({}),
        ] {
            std::fs::write(&source, input.to_string()).unwrap();
            assert!(compile(&source, &output).is_err());
            assert_eq!(std::fs::read_to_string(&output).unwrap(), "previous");
        }
    }
}
