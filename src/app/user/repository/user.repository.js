import { User } from "../model/user.model.js";

export async function updateUserByEmail(email, updatedData) {
  return await User.findOneAndUpdate(
    {email: email}, //filter
    {updatedData},
    { new: true } ,
    {returnDocument: 'after'}// options
  )
}