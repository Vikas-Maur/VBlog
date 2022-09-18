const jwt = require("jsonwebtoken")

const auth = (req, res, next) => {
    const token = req.cookies.token || req.body.token || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        return res.status(400).send("Please login to continue")
    }

    try {
        const decode = jwt.verify(token, process.env.SECRET_KEY)
        console.log(decode)

        req.user = decode

    } catch (error) {
        console.log(error);
        return res.status(400).send("Error occurred")
    }
    return next()
}

module.exports = auth