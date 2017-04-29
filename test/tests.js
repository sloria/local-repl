const path = require('path');
const expect = require('code').expect;
const Lab = require('lab');
const p = require('../');

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;

describe('getDefaultPrompt', () => {
  it('should use short names', (done) => {
    expect(p.getDefaultPrompt('foo')).to.equal('[foo] > ');
    done();
  });

  it('should truncate long names', (done) => {
    const name = 'foobarbazquuuux';
    expect(p.getDefaultPrompt(name)).to.equal('[f] > ');
    done();
  });
});


describe('loadContext', () => {
  it('should load values', (done) => {
    const context = p.loadContext([{ name: 'foo', value: 42 }]);
    expect(context).to.equal({ foo: 42 });
    done();
  });

  it('should load installed modules', (done) => {
    const context = p.loadContext([{ name: 'foo', module: 'lodash' }]);
    expect(context.foo).to.be.a.function();
    done();
  });

  it('should load local modules', (done) => {
    const context = p.loadContext([{ name: 'foo', module: './test/local-module' }]);
    expect(context.foo).to.equal('TEST');
    done();
  });

  it('should throw an error if both module and value passed', (done) => {
    expect(() => p.loadContext([
      { name: 'foo', value: 42, module: 'lodash' },
    ])).to.throw();
    done();
  });

  it('should load strings as modules', (done) => {
    const context = p.loadContext(['lodash']);
    expect(context.lodash).to.be.a.function();
    done();
  });

  it('should camelcase local module names', (done) => {
    const context = p.loadContext(['./test/local-module']);
    expect(context).to.include('localModule');
    expect(context.localModule).to.equal('TEST');
    done();
  });

  it('should error if name not provided', (done) => {
    expect(() => p.loadContext([{ value: 42 }])).to.throw();
    done();
  });

  it('should not accept ./', (done) => {
    expect(() => p.loadContext(['./'])).to.throw();
    done();
  });

  it('should load key value pairs', (done) => {
    const context = p.loadContext({ foo: 42 });
    expect(context).to.equal({ foo: 42 });
    done();
  });
});

describe('loadConfiguration', () => {
  it('should load config from package.json', (done) => {
    const result = p.loadConfiguration({
      package: path.join(__dirname, 'pkg.json'),
      replrc: false,
    });
    expect(result.context).to.equal({ bar: 42 });
    expect(result.prompt).to.equal('<TEST> $');
    expect(result.bannerFunc).to.be.a.function();
    done();
  });

  it('should allow "repl" config to be an array in package.json', (done) => {
    const result = p.loadConfiguration({
      package: path.join(__dirname, 'pkg-with-repl-array.json'),
      replrc: false,
    });
    expect(result.context.bar).to.equal(42);
    expect(result.context.lodash).to.be.a.function();
    expect(result.prompt).to.equal('[foo] > ');
    done();
  });

  it('should allow "repl" config to be an array in replrc', (done) => {
    const result = p.loadConfiguration({
      package: false,
      replrc: path.join(__dirname, 'replrc-with-array.js'),
    });
    expect(result.context.bar).to.equal(43);
    expect(result.context.lodash).to.be.a.function();
    done();
  });


  it('should load config from a replrc file', (done) => {
    const result = p.loadConfiguration({
      package: false,
      replrc: path.join(__dirname, 'replrc.js'),
    });
    expect(result.context.bar).to.equal(43);
    expect(result.context.lodash).to.be.a.function();
    expect(result.prompt).to.equal('[TEST] $');
    done();
  });

  it('should give precedence to replrc file', (done) => {
    const result = p.loadConfiguration({
      package: path.join(__dirname, 'pkg.json'),
      replrc: path.join(__dirname, 'replrc.js'),
    });
    expect(result.context.bar).to.equal(43);
    const banner = result.bannerFunc();
    expect(banner).to.equal('TEST');
    done();
  });

  it('should allow prompts to be defined as a function', (done) => {
    const result = p.loadConfiguration({
      package: path.join(__dirname, 'pkg.json'),
      replrc: path.join(__dirname, 'replrc-with-prompt-func.js'),
    });
    expect(result.context.foo).to.equal('TEST');
    expect(result.promptFunc).to.be.a.function();
    expect(result.promptFunc(result.context, result.package)).to.equal('TEST foo > ');
    done();
  });

  it('should allow context to be an object', (done) => {
    const result = p.loadConfiguration({
      package: path.join(__dirname, 'pkg.json'),
      replrc: path.join(__dirname, 'replrc-with-context-obj.js'),
    });
    expect(result.context.l).to.be.a.function();
    expect(result.context.meaningOfLife).to.equal(42);
    done();
  });

  it('should give precedence to passed options', (done) => {
    const result = p.loadConfiguration({
      package: path.join(__dirname, 'pkg.json'),
      replrc: path.join(__dirname, 'replrc.js'),
      prompt: 'override > ',
      banner: 'OVERRIDE',
    });
    expect(result.prompt).to.equal('override > ');
    expect(result.banner).to.equal('OVERRIDE');
    done();
  });
});
