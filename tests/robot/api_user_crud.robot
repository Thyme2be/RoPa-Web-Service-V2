*** Settings ***
Library         RequestsLibrary
Library         Collections
Library         resources/DbCleanupLibrary.py
Resource        resources/variables.robot
Resource        resources/keywords.robot

Suite Setup     Setup Admin Session
Suite Teardown  Teardown Admin Session

*** Test Cases ***
Admin Can Create User
    [Documentation]    Test creating a new user via Admin API.
    [Tags]             CRUD    Admin
    &{payload}=        Create Dictionary    
    ...                username=${USER_USERNAME}
    ...                title=นาย
    ...                first_name=Robot
    ...                last_name=Tester
    ...                email=${USER_EMAIL}
    ...                password=${USER_PASSWORD}
    ...                role=PROCESSOR
    ...                status=ACTIVE
    
    ${response}=       POST On Session    admin_session    /admin/users    json=${payload}
    Status Should Be   201    ${response}
    
    # [VALIDATION] JSON Schema & Values
    Dictionary Should Contain Key    ${response.json()}    id
    Dictionary Should Contain Key    ${response.json()}    email
    Dictionary Should Contain Key    ${response.json()}    role
    Dictionary Should Contain Key    ${response.json()}    status
    Dictionary Should Contain Key    ${response.json()}    created_at
    
    Should Be Equal As Strings    ${response.json()['email']}       ${USER_EMAIL}
    Should Be Equal As Strings    ${response.json()['first_name']}  Robot
    Should Be Equal As Strings    ${response.json()['status']}      ACTIVE
    
    ${user_id}=        Set Variable    ${response.json()['id']}
    Set Suite Variable  ${CREATED_USER_ID}    ${user_id}

Admin Can List Users
    [Documentation]    Test listing users and finding the newly created one.
    ${response}=       GET On Session     admin_session    /admin/users
    Status Should Be   200    ${response}
    
    # [VALIDATION] Pagination Schema
    Dictionary Should Contain Key    ${response.json()}    total
    Dictionary Should Contain Key    ${response.json()}    items
    Dictionary Should Contain Key    ${response.json()}    page
    Dictionary Should Contain Key    ${response.json()}    limit
    
    ${users}=          Set Variable    ${response.json()['items']}
    ${found}=          Set Variable    ${False}
    FOR    ${user}    IN    @{users}
        IF    "${user['email']}" == "${USER_EMAIL}"
            ${found}=    Set Variable    ${True}
            # [VALIDATION] Item Content Schema
            Dictionary Should Contain Key    ${user}    user_code
            Dictionary Should Contain Key    ${user}    is_active
            BREAK
        END
    END
    Should Be True     ${found}    User not found in list

Admin Can Update User
    [Documentation]    Test updating user details.
    &{update_payload}=  Create Dictionary    first_name=Robot-Updated    last_name=Tester-Updated
    ${response}=       PUT On Session     admin_session    /admin/users/${CREATED_USER_ID}    json=${update_payload}
    Status Should Be   200    ${response}
    
    # [VALIDATION] Integrity Check
    Should Be Equal As Strings    ${response.json()['first_name']}    Robot-Updated
    Should Be Equal As Strings    ${response.json()['last_name']}     Tester-Updated

Admin Can Deactivate User
    [Documentation]    Test deactivating a user (DELETE method in this API).
    ${response}=       DELETE On Session  admin_session    /admin/users/${CREATED_USER_ID}
    Status Should Be   204    ${response}
    
    # Verify status is now INACTIVE
    ${response}=       GET On Session     admin_session    /admin/users
    ${users}=          Set Variable    ${response.json()['items']}
    FOR    ${user}    IN    @{users}
        IF    ${user['id']} == ${CREATED_USER_ID}
            Should Be Equal As Strings    ${user['status']}    INACTIVE
            BREAK
        END
    END

Cleanup Created User From DB
    [Documentation]    Hard delete the user from DB to allow re-running tests.
    [Tags]             Cleanup
    Delete User By Email    ${USER_EMAIL}
