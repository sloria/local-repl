module.exports = {
  context: [{name: 'foo', value: 'TEST'}],
  prompt: (context, pkg) => `${context.foo} ${pkg.name} > `,
};
