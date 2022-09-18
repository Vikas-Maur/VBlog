require("dotenv").config()
require("./config/database").connect()

const User = require('./models/user')
const Post = require('./models/post')

const auth = require('./middlewares/auth')

const cookieParser = require('cookie-parser')

const bcrypt = require("bcryptjs")

const jwt = require("jsonwebtoken")

const express = require("express")

const app = express()

app.use(express.json())
app.use(cookieParser())

app.get("/", (req, res)=>{
    res.send("<h1>Hello world</h1>")
})

app.post("/register", async (req, res)=>{
    try{
        const {name, email, password} = req.body
        if (!(name && email && password)) {
            res.status(400).send("Please enter the name, email and password properly :) ")
        }

        const existingUser = await User.findOne({ email })

        if(existingUser){
            res.status(401).send("User already exists")
        }

        const myEncPassword = await bcrypt.hash(password, 10)

        const user = await User.create({
            name, 
            email: email.toLowerCase(),
            password: myEncPassword,       
        })

        const token = jwt.sign({user_id: user._id, email}, process.env.SECRET_KEY, { expiresIn: "24h" })

        user.token = token

        user.password = undefined

        // res.status(200).json(user)

        const options = {
            expires: new Date(Date.now() + 3*24*60*60*1000),
            httpOnly: true
        }

        res.status(200).cookie("token", token, options).json({
            success: true,
            token,
            user
        })

    }catch(error){
        console.log(error);
        res.status(400).send("ERROR OCCURRED")
    }

})

app.post("/login", async (req, res)=>{
    try{
        const {email, password} = req.body

        console.log(true);

        if(!(email && password)){
            res.status(400).send("Please give us email and password properly")
        }

        const user = await User.findOne({ email })

        if(!(user && await bcrypt.compare(password, user.password))){
            res.status(400).send("Provided credentials are wrong")
        }

        const token = jwt.sign({ user_id: user._id, email }, process.env.SECRET_KEY, {expiresIn: "24h"})
        
        user.token = token

        user.password = undefined

        const options = {
            expires: new Date(Date.now() + 3*24*60*60*1000),
            httpOnly: true
        }

        res.status(200).cookie("token", token, options).json({
            success: true,
            token,
            user
        })

    }catch(error){
        console.log(error);
        res.status(400).send("ERROR OCCURRED")
    }
})

app.get("/dashboard", auth, async (req, res)=>{
    res.status(200).json(req.user)
})

app.get("/user", async (req, res)=>{
    res.status(200).send("success")
})

app.post("/newpost", auth, async (req, res)=>{
    try{
        const { user_id } = req.user
        const { title, content } = req.body

        if(!(title && content)){
            return res.status(400).send("Title or content can't be empty ")
        }

        const post = await Post.create({
            title,
            authorid: user_id,
            content
        })

        res.status(200).json(post)
    } catch(error){
        console.log(error)
        res.status(400).json(error)
    }
})

app.post("/editpost", auth, async (req, res)=>{
    try{
        const { user_id } = req.user
        const { postid, title, content } = req.body

        if(!(postid && title && content)){
            return res.status(400).send("Title or content can't be empty ")
        }

        const post = await Post.findById(postid)
        if ( !(post && post.authorid == user_id) ){
            return res.status(400).send("You can't edit someone else's post")
        }
        post.title = title
        post.content = content
        post.updatedOn = Date.now()
        const savedPost = await post.save()
        res.status(200).json(savedPost)

    }
    catch(error){
        console.log(error)
        res.status(400).json(error)
    }
})

app.delete("/deletepost", auth, async (req, res)=>{
    try{
        const { user_id } = req.user
        const { postid } = req.body

        if (!postid){
            res.status(400).send("No post id provided")
        }

        const post = await Post.findById(postid)
        if ( !(post && post.authorid == user_id) ){
            return res.status(400).send("You can't perform this delete operation")
        }

        await Post.findByIdAndDelete(postid)

        res.status("200").send("Successfully deleted the post :)")

    }catch(error){
        console.log(error)
        res.status(400).json(error)
    }
})

app.post("/likepost", auth, async (req, res)=>{
    try{

        const { user_id } = req.user
        const { postid } = req.body

        if (!postid){
            return res.status(400).send("No post id provided")
        }

        const post = await Post.findById(postid)
        if ( !post ){
            return res.status(400).send("Post does not exists")
        }

        if(post.likedby.includes(user_id)){
            return res.status(404).send("Already liked by the user")
        }

        post.likedby.push(user_id)

        const savedPost = await post.save()

        res.status(200).json(savedPost)

    }catch(error){
        console.log(error)
        res.status(400).send("Error while liking the post")
    }
})

app.post("/unlikepost/", auth, async(req, res)=>{
    try{

        const { user_id } = req.user
        const { postid } = req.params

        if (!postid){
            return res.status(400).send("No post id provided")
        }

        const post = await Post.findById(postid)
        if ( !post ){
            return res.status(400).send("Post does not exists")
        }

        if(post.likedby.includes(user_id)){
            return res.status(404).send("Already liked by the user")
        }

        post.likedby.push(user_id)

        const savedPost = await post.save()

        res.status(200).json(savedPost)

    }catch(error){
        console.log(error)
        res.status(400).send("Error while liking the post")
    }
})

app.get("/post/:postid", auth, async (req, res)=>{
    try{
        const { user_id } = req.user
        const { postid } = req.params

        if (!postid){
            return res.status(400).send("No post id provided")
        }

        const post = await Post.findById(postid)
        if (!post){
            return res.status(404).send("Post does not exists")
        }

        console.log(post)

        res.status(200).json({
            post,
            liked: post.likedby?.includes(user_id)
        })

    }catch(error){
        console.log(error);
        res.status(400).send("Error occurred")
    }
})

app.get("/posts", auth, async (req, res)=>{
    try{
        const { user_id } = req.user

        const posts = await Post.find()
        if (!posts){
            return res.status(404).send("Post does not exists")
        }

        const sortedPosts = posts.sort( (a, b)=>{
            return b.likedby.length - a.likedby.length
        } )

        res.status(200).json({
            sortedPosts
        })

    }catch(error){
        console.log(error);
        res.status(400).send("Error occurred")
    }
})

module.exports = app