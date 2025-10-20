require('dotenv').config({ path: __dirname + '/../.env' });
console.log('POSTGRES_USER=' + (process.env.POSTGRES_USER || '<undefined>'));
console.log('POSTGRES_PASSWORD=' + (process.env.POSTGRES_PASSWORD || '<undefined>'));
console.log('POSTGRES_DB=' + (process.env.POSTGRES_DB || '<undefined>'));
console.log('SKIP_DB=' + (process.env.SKIP_DB || '<undefined>'));
console.log('NODE_ENV=' + (process.env.NODE_ENV || '<undefined>'));