//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../src/extension';

// Defines a Mocha test suite to group tests of similar kind together
suite("Extension Tests", () => {

    // Defines a Mocha unit test
    test("Something 1", () => {
        assert.equal(-1, [1, 2, 3].indexOf(5));
        assert.equal(-1, [1, 2, 3].indexOf(0));
    });

    test('should be present', () => {
		assert.ok(vscode.extensions.getExtension('testforstephen.testtravis'));
	});

    test('should activate', function (done) {
		this.timeout(1 * 60 * 1000);
		return vscode.extensions.getExtension('testforstephen.testtravis').activate().then((api) => {
			done();
		});
	});

    test('should register all hello commands', function (done) {
		return vscode.commands.getCommands(true).then((commands) =>
		{
			let cmds = commands.filter(function(value){
				return 'extension.sayHello' === value;
			});
			assert.ok(cmds.length === 1, 'missing hello commands');
			done();
		});
	});
});