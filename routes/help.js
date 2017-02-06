/**
 * * Copyright (c) 2016, Intel Corporation.
 *
 * This program is licensed under the terms and conditions of the
 * Apache License, version 2.0.  The full text of the Apache License is at
 * http://www.apache.org/licenses/LICENSE-2.0
 */
"use strict";
/**
 * routes related to the user object
 * @type {"express".e}
 */
const express = require('express');
const nm = require('nodemailer');
const fs = require('fs');
const bodyParser = require('body-parser');

let router = express.Router();

let transporter = nm.createTransport({
  host: "localhost",
  port: 25
});

router.post('/', bodyParser.json(), function(req, res, next) {
  if (!req.body.question) {
    req.status(422);
    req.send('question parameter not supplied');
    return;
  }

  let options = {
    from: 'MinnowBoard.org Foundation Support <support@minnowboard.org>',
    to: 'support@minnowboard.org',
    subject: '[minnowboard.org] Web submission',
    text: 'From: ' + (req.body.email || 'anonymous') + "\n"
  };

  options.text += 'Received: ' + Date() + "\n";
  options.text += 'Referring page: ' + req.headers.referer + "\n";
  options.text += "Submitted question: \n\n" + req.body.question;

  try {
    let log = fs.openSync('messages.log', 'a+');
    fs.writeSync(log, "---\n");
    for (var key in options) {
      fs.writeSync(log, key + ': ' + options[key] + "\n");
    }
    fs.closeSync(log);
  } catch (error) {
    console.error('Unable to write to message log (messages.log): ' + error);
  }

  if (transporter) {
    let old = process.env.NODE_TLS_REJECT_UNAUTHORIZE;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    transporter.sendMail(options, function (error, info) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = old;
      if (error) {
        console.log('Error submitting question to ' + options.to);
        console.log(error);
        return;
      }
      console.log('Question submitted to ' + options.to + ' as ' +  info.messageId);
      res.send('Message submitted.');
    });
  } else {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = old;
    console.log('Question written to file, but not sent via email.');
    res.send('Message submitted.');
  }
});

module.exports = router;
