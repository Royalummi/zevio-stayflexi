const bcrypt = require('bcryptjs');
bcrypt.hash('Test@1234', 10).then(h => console.log(h));
