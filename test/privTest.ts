const privJson = `{
    "deleteAlternateContact": {
        "privilege": "DeleteAlternateContact",
        "description": "Grants permission to delete the alternate contacts for an account",
        "accessLevel": "Write",
        "resourceTypes": {
            "account": {
                "resourceType": "account",
                "required": false,
                "conditionKeys": [],
                "dependentActions": []
            },
            "accountInOrganization": {
                "resourceType": "accountInOrganization",
                "required": false,
                "conditionKeys": [],
                "dependentActions": []
            },
            "": {
                "resourceType": "",
                "required": false,
                "conditionKeys": [
                    "account:AlternateContactTypes"
                ],
                "dependentActions": []
            }
        },
        "apiDocumentationLink": "https://docs.aws.amazon.com/accounts/latest/reference/API_DeleteAlternateContact.html"
    },
    "disableRegion": {
        "privilege": "DisableRegion",
        "description": "Grants permission to disable use of a Region",
        "accessLevel": "Write",
        "resourceTypes": {
            "": {
                "resourceType": "",
                "required": false,
                "conditionKeys": [
                    "account:TargetRegion"
                ],
                "dependentActions": []
            }
        },
        "apiDocumentationLink": "https://docs.aws.amazon.com/general/latest/gr/rande-manage.html"
    }
}`

const privTest = JSON.parse( privJson )
const resources = privTest[ 'disableRegion' ][ 'resourceTypes' ]
const keys = Object.keys( resources )

console.log( keys.length )

if ( resources[ '' ] ) {
    console.log( 'true' )
}


