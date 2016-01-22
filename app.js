var express = require('express');
var bodyParser = require('body-parser');
var request = require('request-json')
var app = express();

app.listen(process.env.PORT);

app.use('/bitbucket', bodyParser.json());

app.post('/bitbucket', function (req, res){
  var payload = req.body;
  console.log("Payload: " +payload);
  var codeshipProjectName = payload["build"]["project_name"].split("/");
  var codeshipStatus = payload["build"]["status"];

  var bitbucketOwner = codeshipProjectName[0];
  var bitbucketRepo = codeshipProjectName[1];
  var bitbucketCommit = payload["build"]["commit_id"];
  var bitbucketBaseUrl = "https://api.bitbucket.org/";
  var bitbucketBuildStatusEndpoint = "2.0/repositories/" + bitbucketOwner +"/" + bitbucketRepo + "/commit/" + bitbucketCommit + "/statuses/build";

  switch (codeshipStatus) {
    case "testing":
    case "waiting":
      var bitbucketStatus = "INPROGRESS";
    case "success":
      var bitbucketStatus = "SUCCESSFUL";
    case "error":
    case "stopped":
    case "ignored":
    case "blocked":
    case "infrastructure_failure":
    default:
      var bitbucketStatus = "FAILED";
  }
  var bitbucketKey = "Codeship-" + payload["build"]["project_id"] + "-" + payload["build"]["build_id"];
  var bitbucketName = payload["build"]["message"];
  var bitbucketDescription = payload["build"]["status"];

  var client = request.createClient(bitbucketBaseUrl);
  var bitbucketApiKey = process.env.BITBUCKET_API_KEY;
  var bitbucketUser = process.env.BITBUCKET_USER;
  client.headers["Authorization"] = bitbucketUser + " " + bitbucketApiKey;
  var statusInfo = {
    "state": bitbucketStatus,
    "key": bitbucketKey,
    "name": bitbucketName,
    "url": payload["build"]["build_url"],
    "description": bitbucketDescription
  };
  console.log("statusInfo:" + statusInfo);
  client.post(bitbucketBuildStatusEndpoint, statusInfo, function(err, res, body) {
    console.log(res.statusCode);
    console.log(body);
  });

  res.send("OK");
});
