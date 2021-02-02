const { GraphQLObjectType, GraphQLSchema, GraphQLInt } = require('graphql');

const joinMonster = require('join-monster');

const query = db =>
  new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
      data: {
        type: new GraphQLObjectType({
          name: 'data',
          extensions: {
            joinMonster: {
              sqlTable: 'data',
              uniqueKey: 'id',
            },
          },
          fields: () => ({
            id: {
              type: GraphQLInt,
              description: 'Id of the data',
            },
          }),
        }),
        resolve: (parent, args, context, resolveInfo) =>
          joinMonster.default(resolveInfo, {}, sql => db.query(sql), {
            dialect: 'pg',
          }),
      },
    }),
  });

const schema = db => new GraphQLSchema({ query: query(db) });

module.exports = {
  schema,
};
