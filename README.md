# A AAD B2C custom policy PoC

## Requirements
- [ ] Surface a custom text field on the UI 
- [ ] Surface a group of checkboxes to mimic the capture of user preferences when signing up, e.g. EULA, email campaigns, etc.
- [ ] Call the custom rest api with the user input values 
- [ ] On successful http response code, proceed with creating the user account in B2C otherwise surface error to user on UI.
## Initial Thoughts
1. A temporary password will need to created in B2C to create an a B2C account.  B2C requires a password for local accounts.  
2. Upon first sign in, the user will be prompted to provide a valid password that will be used going forward.
   
## Steps
- [x] 1. Add the new *ClaimTypes* in the *BuildBlocks*
- [x] 2. Copy the *LocalAccountSignUpWithLogonEmail Technical Profile* from base in the in the *ClaimProviders* section to override the Local Account sign up.
  - [x] a. Disable email verification, i.e 'Send Verification Code' 
  - [x] b. Set the input claims that require a default value.  Important: set the newPassword claim with a temporary password that the satisfies the b2c password policy, i.e. lowercase, uppercase and a number.
  - [x] c. Set the display claims to show only the desired fields on the UI  Here we hide the newPassword and reenterPassword fields since we are setting the new user with temp password.
  - [x] d. copy all the output claims from the base and add the new fields in the preferred order.
  - [x] e. Add new validationTechnicalProfile that calls the rest api so the account creation is dependent on success of the api otherwise the account is not created and a user is prompted with an error message. 
- [x] 3. Add a new rest api *TechnicalProfile*.
  - [x] a. Add the new claimTypes as *InputClaims*.
- [x] 4. Create the actual custom rest api
  - [x] a. Receive json body that contains the claims
  - [x] b. Process the json body 
  - [x] c. Return a status code 200 if success.
  - [x] d. Return a status code 409 with a validation error message/json so messages is surfaced on UI AND to prevent the processing of any subsequent validation technical profiles, i.e. the account creation (AAD-UserWriteUsingLogonEmail). 
- [x] 5. Set up B2C to force password reset on first login (since a temp password is assigned above)
  - [x] a. Follow the instructions from https://github.com/azure-ad-b2c/samples/tree/master/policies/force-password-reset-first-logon with some tweaks in this repo.
  - [x] b. Upload the TrustFrameworkExtensions.xml and SignUpOrSigin.xml under ***ForcePasswordResetOnFirstLogin*** folder.  These policies have been modified to support only a Local account IDP.
  - [x] c. To verify the new mustResetPassword extension is available:
    - [x] i. Create a native user account in your B2C tenant with [Your b2c domain].onmicrosoft.com domain
    - [x] ii. Assign the native user an Azure role of **User administrator** so it is allowed to create users 
    - [x] iii. Sign into the AD graph explorer (https://graphexplorer.azurewebsites.net) with the new account.
    - [x] iv. Run the following query: https://graph.windows.net/myorganization/applications/[Your ApplicationObjectId]/extensionProperties
    - [x] v. To test a a forced reset, use the AD graph explorer and issue a POST against https://graph.windows.net/myorganization/users (with api-version=1.6) with the following post body:
        ```
          {
            "accountEnabled": true,
            "mailNickname": "AlexW",
            "signInNames": [{
                  "type": "emailAddress",
                  "value": "alexw@contoso.com"
            }],
            "creationType": "LocalAccount",
            "displayName": "AlexWu",
            "givenName": "Alex",
            "surname": "Wu",  
            "passwordProfile": {
              "password": "tempPassword1",
              "forceChangePasswordNextLogin": false
            },
            "userPrincipalName": "AlexWu@[Your b2c domain].onmicrosoft.com",
            "extension_[Replace with the from step iii]_mustResetPassword": true
          }
        ```  
- [ ] 6. Protect the rest api using oauth
- [ ] 7. Update the xml to call the api with Bearer access token.
- [x] 8. Optional (Nice to haves)
  - [x] a. Added a ClaimsTransformation to the BuildBlock section to set the display to the new user's email instead of defaulting to None
  - [x] b. Copied the *AAD-UserWriteUsingLogonEmail* TP to override it with the new CreateDisplayNameFromEmail ClaimsTransformation.
         