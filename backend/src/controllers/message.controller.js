import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

export const getUserForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
        res.status(200).json(filteredUsers);
    } catch (error) {
        console.log("Error in getUsersForSidebar");
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params; // Lấy ID từ URL
        const myId = req.user._id; // Lấy ID của người đang đăng nhập (qua JWT)
        
        const message = await Message.find({
          $or: [
            { senderId: myId, receiverId: userToChatId },
            { senderId: userToChatId, receiverId: myId },
          ],
        }); 

        res.status(200).json(message);
    } catch (error) {
        console.log("Error in getMessage controller: ", error.message);
        res.status(500).json({ message: "Internal Server Error" });      
    };
};

export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let imageUrl;
        if (image) {
            // upload base64 image to cloudinary
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });

        await newMessage.save();

        // todo: realtime functionality goes here => socket.io
        // Kiểm tra xem người nhận nào có online không -> nếu có thì gửi real time
        const receiverSocketId = getReceiverSocketId(receiverId)
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage)
        }

        res.status(200).json(newMessage);

    } catch (error) {
        console.log("Error in sendMessage controller: ", error.message);
        res.status(500).json({ message: "Internal Server Error" }); 
    }
}