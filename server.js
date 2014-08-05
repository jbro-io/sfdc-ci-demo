'use strict';
//================================================================================
// Libraries
//================================================================================
var jsforce      = require('jsforce');
var _            = require('underscore');
var xmlBuilder   = require('xmlbuilder');
var exec         = require('child_process').exec;
var fs           = require('fs');

//================================================================================
// Initialization
//================================================================================
var conn = new jsforce.Connection();
conn.login('jonathan@jbro.io', '2^Eswk7JQhxBfdbr/56qmLLkVFysbEbgClmDPpu0jf', function(err, res) {
    if(err) return console.error(err);
    console.log(res);

    // describe org metadata
    var xml = xmlBuilder.create('Package', {version: '1.0', encoding: 'UTF-8', standalone: true});
    xml.root().att('xmls', 'http://soap.sforce.com/2006/04/metadata');

    console.log('Retrieving salesforce metadata...');
    conn.metadata.describe(function(err, describeResult) {
        if(err) return console.log(err);

        var metaList = [];
        var excludedMeta = [];
        _.each(describeResult.metadataObjects, function(metaObj) {
            if(!metaObj.inFolder && metaObj.xmlName != 'CustomObject') {
                metaList.push(metaObj.xmlName);

                xml.ele('types')
                    .ele('members', null, '*')
                    .up()
                    .ele('name', metaObj.xmlName);

            }
            else {
                if(metaObj.xmlName !== 'CustomObject')
                    excludedMeta.push(metaObj.xmlName);
            }
        });
        console.log(excludedMeta);

        console.log('Listing metadata file properties...');
        conn.metadata.list({type:'CustomObject'}, function(err, fileProps) {
            if(err) return console.error(err);

            var customObjectElement = xml.ele('types');

            _.each(fileProps, function(obj) {

                customObjectElement.ele('members', null, obj.fullName);

            });

            customObjectElement
                .ele('members', null, '*')
                .up()
                .ele('name', null, 'CustomObject');

            xml.ele('version', null, '31.0');
            console.log(xml.toString({pretty: true}));
            // res.send(xml.end());

            fs.writeFile('./package.xml', xml.end({pretty: true, indent:'    ', newline:'\n'}), function(err) {
                if(err) return console.log(err);

                exec('ant retrieveUnpackaged', function(err, result) {
                    if(err) return console.log(err);
                    // res.send('package.xml successfully saved!\n' + result);
                    console.log('[ Salesforce package successfully retrieved ]');
                    console.log(result);
                });

            });
        });
    });
});
