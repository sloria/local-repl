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
    p.loadContext([{ name: 'foo', value: 42 }])
      .then((context) => {
        expect(context).to.equal({ foo: 42 });
        done();
      });
  });

  it('should load installed modules', (done) => {
    p.loadContext([{ name: 'foo', module: 'lodash' }])
      .then((context) => {
        expect(context.foo).to.be.a.function();
        done();
      });
  });

  it('should load local modules', (done) => {
    p.loadContext([{ name: 'foo', module: './test/local-module' }])
      .then((context) => {
        expect(context.foo).to.equal('TEST');
        done();
      });
  });

  it('should throw an error if both module and value passed', (done) => {
    p.loadContext([
      { name: 'foo', value: 42, module: 'lodash' },
    ]).catch((message) => {
      expect(message).to.equal('Context entry for "foo" cannot define both "module" and "value".');
      done();
    });
  });

  it('should throw an error if neither module nor value are passed', (done) => {
    p.loadContext([{ name: 'foo' }])
      .catch((message) => {
        expect(message).to.equal('Context entry must contain either "module" or "value".');
        done();
      });
  });

  it('should load strings as modules', (done) => {
    p.loadContext(['lodash']).then((context) => {
      expect(context.lodash).to.be.a.function();
      done();
    });
  });

  it('should camelcase local module names', (done) => {
    p.loadContext(['./test/local-module']).then((context) => {
      expect(context).to.include('localModule');
      expect(context.localModule).to.equal('TEST');
      done();
    });
  });

  it('should error if name not provided', (done) => {
    p.loadContext([{ value: 42 }]).catch((message) => {
      expect(message).to.equal('"name" is required for each context entry.');
      done();
    });
  });

  it('should not accept ./', (done) => {
    p.loadContext(['./']).catch((message) => {
      expect(message).to.equal('Invalid name "./"');
      done();
    });
  });

  it('should load key value pairs', (done) => {
    p.loadContext({ foo: 42 }).then((context) => {
      expect(context).to.equal({ foo: 42 });
      done();
    });
  });

  it('should load promises with context array', (done) => {
    const promise = Promise.resolve(42);
    p.loadContext([{ name: 'meaning', value: promise }])
      .then((context) => {
        expect(context).to.equal({ meaning: 42 });
        done();
      });
  });

  it('should load promises with context object', (done) => {
    const promise = Promise.resolve(42);
    p.loadContext({ meaning: promise })
      .then((context) => {
        expect(context).to.equal({ meaning: 42 });
        done();
      });
  });
});

describe('loadConfiguration', () => {
  it('should load config from package.json', (done) => {
    p.loadConfiguration({
      package: path.join(__dirname, 'pkg.json'),
      replrc: false,
    }).then((result) => {
      expect(result.context).to.equal({ bar: 42 });
      expect(result.prompt).to.equal('<TEST> $');
      expect(result.bannerFunc).to.be.a.function();
      done();
    });
  });

  it('should allow "repl" config to be an array in package.json', (done) => {
    p.loadConfiguration({
      package: path.join(__dirname, 'pkg-with-repl-array.json'),
      replrc: false,
    }).then((result) => {
      expect(result.context.bar).to.equal(42);
      expect(result.context.lodash).to.be.a.function();
      expect(result.prompt).to.equal('[foo] > ');
      done();
    });
  });

  it('should allow "repl" config to be an array in replrc', (done) => {
    p.loadConfiguration({
      package: false,
      replrc: path.join(__dirname, 'replrc-with-array.js'),
    }).then((result) => {
      expect(result.context.bar).to.equal(43);
      expect(result.context.lodash).to.be.a.function();
      done();
    });
  });


  it('should load config from a replrc file', (done) => {
    p.loadConfiguration({
      package: false,
      replrc: path.join(__dirname, 'replrc.js'),
    }).then((result) => {
      expect(result.context.bar).to.equal(43);
      expect(result.context.lodash).to.be.a.function();
      expect(result.prompt).to.equal('[TEST] $');
      done();
    });
  });

  it('should give precedence to replrc file', (done) => {
    p.loadConfiguration({
      package: path.join(__dirname, 'pkg.json'),
      replrc: path.join(__dirname, 'replrc.js'),
    }).then((result) => {
      expect(result.context.bar).to.equal(43);
      const banner = result.bannerFunc();
      expect(banner).to.equal('TEST');
      done();
    });
  });

  it('should allow prompts to be defined as a function', (done) => {
    p.loadConfiguration({
      package: path.join(__dirname, 'pkg.json'),
      replrc: path.join(__dirname, 'replrc-with-prompt-func.js'),
    }).then((result) => {
      expect(result.context.foo).to.equal('TEST');
      expect(result.promptFunc).to.be.a.function();
      expect(result.promptFunc(result.context, result.package)).to.equal('TEST foo > ');
      done();
    });
  });

  it('should allow context to be an object', (done) => {
    p.loadConfiguration({
      package: path.join(__dirname, 'pkg.json'),
      replrc: path.join(__dirname, 'replrc-with-context-obj.js'),
    }).then((result) => {
      expect(result.context.l).to.be.a.function();
      expect(result.context.meaningOfLife).to.equal(42);
      done();
    });
  });

  it('should give precedence to passed options', (done) => {
    p.loadConfiguration({
      package: path.join(__dirname, 'pkg.json'),
      replrc: path.join(__dirname, 'replrc.js'),
      prompt: 'override > ',
      banner: 'OVERRIDE',
    }).then((result) => {
      expect(result.prompt).to.equal('override > ');
      expect(result.banner).to.equal('OVERRIDE');
      done();
    });
  });
});


describe('contextKey', () => {
  it('should camelcase local paths with dashes', (done) => {
    expect(p.contextKey('./utils/foo-bar')).to.equal('fooBar');
    expect(p.contextKey('/utils/foo-bar')).to.equal('fooBar');
    done();
  });

  it('should camelcase snakecase names', (done) => {
    expect(p.contextKey('./utils/foo_bar')).to.equal('fooBar');
    done();
  });

  it('should camelcase package names with dashes', (done) => {
    expect(p.contextKey('foo-bar')).to.equal('fooBar');
    done();
  });
});
