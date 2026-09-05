# Common API response

| Field   | Type   | Mandatory | Remarks                                                                                    |
| ------- | ------ | --------- | ------------------------------------------------------------------------------------------ |
| code    | string | Yes       | "000000" means success. Other error codes please refer to "[error code](5.error-code.md)". |
| message | string | No        | Error message, please refer to "[error code](5.error-code.md)".                            |
| data    | object | No        | A json object of returned data.                                                            |

#

### Example

Success response:

```json
{
    "code": "000000",
    "message": "OK",
    "data": { ... }
}
```

Error response:

```json
{
  "code": "1160102",
  "message": "Request parameter is illegal: amount",
  "data": null
}
```
