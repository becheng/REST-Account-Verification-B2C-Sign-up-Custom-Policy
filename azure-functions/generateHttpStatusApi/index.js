module.exports = async function (context, req) {

    const top10HttpStausCodes = ["200","201","204","304","400","401","403","404","409","500"];

    context.log("Payload of incoming request body:");
    context.log(req.body);
    
    const submittedHttpStatusCode = req.body.httpStatusCode;
    context.log("submitted http status code: " + submittedHttpStatusCode);

    let errorResponse;
    let responseHttpStatus = submittedHttpStatusCode;

    // format of the error response from this msdoc 
    // https://docs.microsoft.com/en-us/azure/active-directory-b2c/restful-technical-profile#returning-validation-error-message

    if (!top10HttpStausCodes.includes(submittedHttpStatusCode) || "409" == submittedHttpStatusCode){
        errorResponse = {
            "version": "1.0.0",
            "status": 409,
            "code": "API12345",
            //"requestId": "50f0bd91-2ff4-4b8f-828f-00f170519ddb",
            "userMessage": "User has submitted a http status not in the top 10 status codes " + 
                "(https://www.restapitutorial.com/httpstatuscodes.html) OR a 409 code was submitted" ,
            "developerMessage": "To fix, user should submit a  top ten http status code (https://www.restapitutorial.com/httpstatuscodes.html)"
            //"moreInfo": "https://restapi/error/API12345/moreinfo"
        }

        responseHttpStatus = 409;
    } 
    
    context.res = {
        status: responseHttpStatus,
        body: errorResponse, 
        headers: {'Content-Type': 'application/json'}
    };
}