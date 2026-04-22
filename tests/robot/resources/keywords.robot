*** Settings ***
Library    RequestsLibrary
Library    Collections
Resource   variables.robot

*** Keywords ***
Login As Admin
    [Documentation]    Authenticates as admin and returns the access token.
    &{auth_payload}=    Create Dictionary    username_or_email=${ADMIN_EMAIL}    password=${ADMIN_PASSWORD}
    ${response}=        POST    ${API_URL}/auth/login    json=${auth_payload}
    Status Should Be    200    ${response}
    ${token}=           Set Variable    ${response.json()['access_token']}
    RETURN           ${token}

Setup Admin Session
    [Documentation]    Creates an authorized session for admin.
    ${token}=           Login As Admin
    &{headers}=         Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    Create Session      admin_session    ${API_URL}    headers=${headers}    verify=True

Teardown Admin Session
    Delete All Sessions
