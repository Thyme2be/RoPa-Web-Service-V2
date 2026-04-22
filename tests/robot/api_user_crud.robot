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
    ${user_id}=        Set Variable    ${response.json()['id']}
    Set Suite Variable  ${CREATED_USER_ID}    ${user_id}
    Should Be Equal As Strings    ${response.json()['email']}    ${USER_EMAIL}

Admin Can List Users
    [Documentation]    Test listing users and finding the newly created one.
    ${response}=       GET On Session     admin_session    /admin/users
    Status Should Be   200    ${response}
    ${users}=          Set Variable    ${response.json()['items']}
    ${found}=          Set Variable    ${False}
    FOR    ${user}    IN    @{users}
        IF    "${user['email']}" == "${USER_EMAIL}"
            ${found}=    Set Variable    ${True}
            BREAK
        END
    END
    Should Be True     ${found}    User not found in list

Admin Can Update User
    [Documentation]    Test updating user details.
    &{update_payload}=  Create Dictionary    first_name=Robot-Updated    last_name=Tester-Updated
    ${response}=       PUT On Session     admin_session    /admin/users/${CREATED_USER_ID}    json=${update_payload}
    Status Should Be   200    ${response}
    Should Be Equal As Strings    ${response.json()['first_name']}    Robot-Updated

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
