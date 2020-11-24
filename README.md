# REST Account Verification B2C Sign-up Custom Policy
This is a high level walk-through of developing an Azure AD B2C Custom Policy that calls a RESTful api to verify a new user's account prior to creating a Local Account in your B2C tenant.
In this sample, we cover the following:

- Surface a custom input text field to represent user input of account info, e.g. account number, last bill amount on the sign up UI. 
- Surface a group of checkboxes on sign up UI to mimic the capture of a user's preferences, e.g. EULA, email campaigns, etc.
- Call a custom REST api that receives and processes the inputs from the sign-up UI and returns either a success response which then proceeds with the creation of the local account or a failed response with a custom error message that will be shown on the sign up UI.
- The account verification will be used in lieu of a new user needing to set up a new password on sign-up.     
## Design Considerations
1. B2C requires a password for a local account so a temporary password will be used when creating the user's account.  
2. Upon first sign in, the user will be prompted to reset their password with a personalized password that will be used going forward.
3. The custom REST api will be secured using Oauth2. 

## Prerequisites
1. Complete the B2C starter pack: https://docs.microsoft.com/en-us/azure/active-directory-b2c/custom-policy-get-started.  We will build on the *TrustFrameworkExtensions.xml* for this sample.
**Note:** Since we are using Local Accounts only in this sample, you may apply starter pack instructions to the xml files under the *Local Accounts* folder instead and ignore the steps referring the setting up the Facebook social IDP.
2. Once you have verified all the replying party policies from the starter pack are in working order, make a copy of the *TrustFrameworkExtensions.xml* and rename it to **RestAccountVerification_TrustFrameworkExtensions.xml** or something meaningful.
3. Open the file and update the PolicyId and PublicPolicyUri to match the new file name or provide an alternative name that is meaningful.  Example: 
   ```
   PolicyId="B2C_1A_RestAccountVerification_TrustFrameworkExtensions" 
   
   PublicPolicyUri="http://[yourtenant].onmicrosoft.com/B2C_1A_RestAccountVerification_TrustFrameworkExtensions">
   ```
   When uploading this Policy to the B2C Identity Experience Framework, it will be uploaded under the new name and not overwrite the starter pack policies.  When developing, it's always nice to have the option to refer back to working baseline.

4. Repeat the process for the *SignUpOrSignIn.xml* policy.
5. Have your REST api handy to integrate with and we highly recommended to initially deploy it locally for ease of testing and development.  Download [ngrok](https://ngrok.com/) to reverse proxy to your localhost.  
**Note:** This sample uses the *generateHttpStatusApi* api - a HttpTrigger Azure Function located in the *azure-functions* folder.  The api performs a trivial process and just returns the same http status code as submitted to the api as a response.     

         
## Instructions
- [x] 1. Add new *ClaimTypes* for your new UI fields and other supporting claims in the *BuildBlocks*.
  
- [x] 2. Copy the *LocalAccountSignUpWithLogonEmail* Technical Profile (TP) from *TrustFrameworkBase.xml* in the in the *ClaimProviders* section to override the Local Account sign up.  Do the the following within the TP:
  - [x] a. Disable email verification, i.e the 'Send Verification Code' button on the sign up UI. 
  - [x] b. Add the *InputClaims* that require a default value.  **Important**: set the *newPassword* claim with a temporary password that the satisfies the b2c password policy, i.e. lowercase, uppercase and a number.
  - [x] c. Add the *DisplayClaims* to show only the desired fields on the UI.  Here we hide the newPassword and reenterPassword fields since we are setting the new user with temporary password.
  - [x] d. Copy all the *OutputClaims* from *TrustFrameworkBase.xml* and add the new fields that you want to appear on the UI in the preferred order.
  - [x] e. Add a new *ValidationTechnicalProfile* that calls the REST api so the account creation is dependent on success of the api otherwise the account is not created and a user is prompted with an error message. 
  
- [x] 3. Add a new REST api TP.
  - [x] a. For now, set up its items in *MetaData* to call  the API locally and unprotected to make it easier to develop and test the integration with the api.
  - [x] b. Add the new *InputClaims* to be passed to the api.
  
- [x] 4. Create the custom REST api (or modify an existing one). 
  - [x] a. Receive json body that contains the claims.
  - [x] b. Do the processing.
  - [x] c. Return a status code 200 if success.
  - [x] d. **Important**: Return a status code 409 with a validation error message/json so the error message is surfaced on UI AND to prevent the processing of any subsequent validation technical profiles, i.e. the account creation (*AAD-UserWriteUsingLogonEmail*).
   
- [x] 5. Set up B2C to force password reset on first login (since a temp password is assigned above).
  - [x] a. Follow the instructions from https://github.com/azure-ad-b2c/samples/tree/master/policies/force-password-reset-first-logon with some tweaks in this repo.
  - [x] b. Upload the *TrustFrameworkExtensions.xml* and *SignUpOrSigin.xml* under *ForcePasswordResetOnFirstLogin* folder.  These policies have been modified to support only a Local account IDP.
  **Important**: Make sure to update the file with your b2c tenant.
  - [x] c. *Optional*: To verify the new mustResetPassword extension is available:
    - [x] i. Create a native user account in your B2C tenant with *[Your b2c domain].onmicrosoft.com* domain
    - [x] ii. Assign the native user an Azure role of **User administrator** so it is allowed to create users 
    - [x] iii. Sign into the AD graph explorer (https://graphexplorer.azurewebsites.net) with the new account.
    - [x] iv. Run the following query: https://graph.windows.net/myorganization/applications/[Your ApplicationObjectId]/extensionProperties
    - [x] v. To test a a forced reset, use the AD graph explorer and issue a POST against https://graph.windows.net/myorganization/users OR https://graph.windows.net/[Your b2c domain].onmicrosoft.com/users (with api-version=1.6) with the following post body:
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
  - [x] d. Copy and paste the ClaimTypes, TPs, and UserJourney from the ForceReset demo policy to your B2C policy extensions file OR just copy from our policy sample.
  - [x] e. Update the SignUpOrSignIn Replying Party file to use the new user journey.
  - [x] f. Add an additional **extension_isFirstLogin** to capture the first login via the sign up to use it as precondition checks in the TP so avoid firing the force password reset on sign up (see our sample in this repo).
     
- [x] 6. Protect the REST api using oauth.  
  **Note: **In this sample, we  deploy our Azure Function api to an Azure Function App with easy-auth enabled.
  - [x] a. Deploy the function to Azure and test policy with unprotected function to Azure.
  - [x] b. Implement easy-auth on the function app with the B2C tenant as the issuer using the oauth2 client credentials flow.  Ref: https://docs.microsoft.com/en-us/azure/app-service/overview-authentication-authorization
  - [x] c. If having issues, use [Postman](https://www.postman.com/) to the verify acquiring an access_token and using it as a Bearer token to access the protected api.   

- [x] 7. Update your policy to call the api with a Bearer access token. Ref: https://docs.microsoft.com/en-us/azure/active-directory-b2c/secure-rest-api#oauth2-bearer-authentication
  - [x] a. Created **RestapiClientId** and **RestapiClientSecret** Policy Keys in B2C using the clientId and secret of the Azure AD app/Service Principal used for securing the Function app. 
  - [x] b. Add the new bearer token *ClaimType* to the policy.
  - [x] c. Add a new **SecureRestAPI-AccessToken** TP that obtains a access_token using the client credential flow (see our sample).
  - [x] d. Modify the REST api TP's *MetaData* to use the protected api url and to access it using a bearer token. 
   
- [x] 8. Optional (Nice to haves)
  - [x] a. Added a ClaimsTransformation to the BuildBlock section to set the display to the new user's email instead of defaulting to *None*
  - [x] b. Copied the *AAD-UserWriteUsingLogonEmail* TP to override it with the new CreateDisplayNameFromEmail ClaimsTransformation.
         