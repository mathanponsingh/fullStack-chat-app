import Message from "../models/message.model.js"
import User from "../models/user.model.js"
import cloudinary from "../lib/cloudinary.js"
import { getRecieverSocketId } from "../lib/socket.js"
import { io } from "../lib/socket.js"
export const getUsersForSidebar = async (req,res) => {
    try {
        const currentUserId = req.user._id
        const filteredUser = await User.find({_id:{$ne:currentUserId}}).select("-password")
        res.status(200).json(filteredUser)
    } catch (error) {
        console.log("Erorr in message controller: ",error.message);
        res.status(500).json({message:"Internal server error"})
    }
}

export const getMessages = async (req,res) => {
    try {
        const {id:toChatId} = req.params
        const myId = req.user._id
        const messages = await Message.find({
            $or:[
                {senderId:myId,recieverId:toChatId},
                {senderId:toChatId,recieverId:myId}
            ]
        })
        res.status(200).json(messages)
    } catch (error) {
        console.log("Error in getMessages controller : ",error.message);
        res.status(500).json({message:"Internal server error"})
    }
}

export const sendMessage = async (req,res) => {
    try {
        const { text, image } = req.body
        const {id:recieverId} = req.params
        const senderId = req.user._id
        let imageUrl;
        if(image){
            const Response = await cloudinary.uploader.upload(image)
            imageUrl = Response.secure_url
        }
        const newMessage = new Message({
            senderId,
            recieverId,
            text,
            image:imageUrl
        })
        await newMessage.save()
        const receiverSocketId = getRecieverSocketId(recieverId);
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage",newMessage)
        }
        res.status(201).json(newMessage)

    } catch (error) {
        console.log("Error in sendMessage controller : ",error.message);
        res.status(500).json({message:"Internal server error"})
    }
}