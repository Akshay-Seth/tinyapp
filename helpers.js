const getUserByEmail = function(email, database) {
    const mail = email
    let foundUser;
    for (const userId in database) {
        const user = database[userId];
        if (user.email === email) {
          foundUser = user;
        }
      }
    return user
  };

module.exports
exports.getUserByEmail = getUserByEmail;