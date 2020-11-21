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
- [x] 1. Add the 2 new *ClaimTypes* in the *BuildBlocks*
- [x] 2. Copy the *LocalAccountSignUpWithLogonEmail Technical Profile* from base in the in the *ClaimProviders* section to override the Local Account sign up.
  - [x] a. Disable email verification, i.e 'Send Verification Code' 
  - [x] b. Set the input claims that require a default value.  Important: set the newPassword claim with a temporary passowrd that the satisfies the b2c password policy, i.e. lowercase, uppercase and a number.
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
- [ ] 5. Protect the rest api using oauth
- [ ] 6. Update the xml to call the api with Bearer access token.
- [x] 7. Optional (Nice to haves)
  - [x] a. Added a ClaimsTransformation to the BuildBlock section to set the display to the new user's email instead of defaulting to None
  - [x] b. Copied the *AAD-UserWriteUsingLogonEmail* TP to override it with the new CreateDisplayNameFromEmail ClaimsTranformation.
         