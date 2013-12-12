/*
 * Copyright 2013 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var dns = require('vertx/dns');
var vertxTest = require("vertx_tests");
var vassert = vertxTest.vassert;

var DnsServer = org.vertx.testtools.TestDnsServer;
var server = null; // server instance set in prepareDns

// Debugging
var console = require('vertx/console');

function prepareDns(srv, testFunc) {
  server = srv;
  server.start();
  testFunc( dns.createDnsClient( server.getTransports()[0].getAcceptor().getLocalAddress() ) );
}

function vertxStop() {
  if (server) {
    server.stop();
  }
}

var dnsTest = {
  testCreateDnsClient: function() {
    var ip = '10.0.0.1';
    prepareDns(DnsServer.testResolveA(ip), function(client) {
      vassert.assertTrue("Can't create DnsClient", typeof client === 'object');
      vassert.testComplete();
    });
  },

  testLookup: function() {
    var ip = '10.0.0.1';
    prepareDns(DnsServer.testResolveA(ip), function(client) {
      client.lookup("vertx.io", function(err, address) {
        vassert.assertNotNull(address);
        vassert.assertTrue("Unexpected address: " + address, ip === address);
        vassert.testComplete();
      });
    });
  },

  testLookup4: function() {
    var ip = '10.0.0.1';
    prepareDns(DnsServer.testResolveA(ip), function(client) {
      client.lookup4("vertx.io", function(err, address) {
        vassert.assertNotNull(address);
        vassert.assertTrue("Unexpected address: " + address, ip === address);
        vassert.testComplete();
      });
    });
  },

  testLookup6: function() {
    prepareDns(DnsServer.testLookup6(), function(client) {
      client.lookup6("vertx.io", function(err, address) {
        vassert.assertNotNull(address);
        vassert.assertTrue("Unexpected address: " + address, '0:0:0:0:0:0:0:1' === address);
        vassert.testComplete();
      });
    });
  },

  testLookupNonexisting: function() {
    prepareDns(DnsServer.testLookupNonExisting(), function(client) {
      client.lookup("asdfadsf.com", function(err, address) {
        vassert.assertNotNull(err);
        vassert.assertTrue(err instanceof org.vertx.java.core.dns.DnsException);
        vassert.testComplete();
      });
    });
  },

  testResolveNS: function() {
    var ns = 'ns.vertx.io';
    prepareDns(DnsServer.testResolveNS(ns), function(client) {
      client.resolveNS("vertx.io", function(err, records) {
        vassert.assertTrue("Unexpected number of response records: " + records.length, 1 === records.length);
        vassert.assertTrue("Unexpected result: " + records[0], ns === records[0]);
        vassert.testComplete();
      });
    });
  },

  testResolveTxt: function() {
    var txt = "vert.x is awesome";
    prepareDns(DnsServer.testResolveTXT(txt), function(client) {
      client.resolveTXT("vertx.io", function(err, records) {
        vassert.assertTrue("Unexpected number of response records: " + records.length, 1 === records.length);
        vassert.assertTrue("Unexpected result: " + records[0], txt === records[0]);
        vassert.testComplete();
      });
    });
  },

  testResolveMx: function() {
    var prio = 10,
        name = "mail.vertx.io";
    prepareDns(DnsServer.testResolveMX(prio, name), function(client) {
      client.resolveMX("vertx.io", function(err, records) {
        vassert.assertTrue("Unexpected result: " + records[0].priority, prio == records[0].priority);
        vassert.assertTrue("Unexpected result: " + records[0].name, name === records[0].name);
        vassert.testComplete();
      });
    });
  },

  testResolveA: function() {
    var ip = '10.0.0.1';
    prepareDns(DnsServer.testResolveA(ip), function(client) {
      client.resolveA("vertx.io", function(err, records) {
        vassert.assertNotNull(records);
        vassert.assertTrue("Unexpected address: " + records[0], ip === records[0]);
        vassert.testComplete();
      });
    });
  },

  testResolveAAAA: function() {
    var ip = '::1';
    prepareDns(DnsServer.testResolveAAAA(ip), function(client) {
      client.resolveAAAA("vertx.io", function(err, records) {
        vassert.assertNotNull(records);
        vassert.assertTrue("Unexpected address: " + records[0], '0:0:0:0:0:0:0:1' === records[0]);
        vassert.testComplete();
      });
    });
  },

  testResolveCNAME: function() {
    var cname = "cname.vertx.io";
    prepareDns(DnsServer.testResolveCNAME(cname), function(client) {
      client.resolveCNAME("vertx.io", function(err, records) {
        vassert.assertNotNull(records);
        vassert.assertTrue("Unexpected address: " + records, cname === records[0]);
        vassert.testComplete();
      });
    });
  },

  testResolvePTR: function() {
    var ptr = "ptr.vertx.io";
    prepareDns(DnsServer.testResolvePTR(ptr), function(client) {
      client.resolvePTR("10.0.0.1.in-addr.arpa", function(err, record) {
        vassert.assertNotNull(record);
        vassert.assertTrue("Unexpected address: " + record, ptr === record);
        vassert.testComplete();
      });
    });
  },

  testResolveSRV: function() {
    var prio = 10,
        weight = 1,
        port = 80,
        target = 'vertx.io';
    prepareDns(DnsServer.testResolveSRV(prio, weight, port, target), function(client) {
      client.resolveSRV("vertx.io", function(err, records) {
        vassert.assertNotNull(records);
        var record = records[0];
        vassert.assertTrue("Unexpected value: " + record.priority, prio == record.priority);
        vassert.assertTrue("Unexpected value: " + record.weight, weight == record.weight);
        vassert.assertTrue("Unexpected value: " + record.port, port == record.port);
        vassert.assertTrue("Unexpected address: " + record.target, target === record.target);

        vassert.testComplete();
      });
    });
  },

  testReverseLookupIPv4: function() {
    var ptr = 'ptr.vertx.io';
    prepareDns(DnsServer.testReverseLookup(ptr), function(client) {
      client.reverseLookup('10.0.0.1', function(err, record) {
        vassert.assertNotNull(record);
        vassert.assertTrue("Unexpected address: " + record, record === ptr);
        vassert.testComplete();
      });
    });
  },

  testReverseLookupIPv6: function() {
    var ptr = 'ptr.vertx.io';
    prepareDns(DnsServer.testReverseLookup(ptr), function(client) {
      client.reverseLookup('::1', function(err, record) {
        vassert.assertNotNull(record);
        vassert.assertTrue("Unexpected address: " + record, record === ptr);
        vassert.testComplete();
      });
    });
  },

};

vertxTest.startTests(dnsTest);
