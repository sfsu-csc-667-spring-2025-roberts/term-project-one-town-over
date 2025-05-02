import db from "../connection"
import bcrypt from "bcrypt";

export type User = {
    id:number;
    email: string;
    password: string;
};

const register = async (email: string, password:string) => {
    
    const encryptedPassword = await bcrypt.hash(password, 10);

    const {id} = await db.one("INSERT INTO usertest (email, password) VALUES ($1, $2) RETURNING id", [email, encryptedPassword]);

    return id;
};



const login = async (email: string, password:string ) => {

    const user = await db.one<User>("SELECT * FROM usertest WHERE email = $1", [email]);

    console.log("User from DB:", user);
    console.log("Input password:", password);
    console.log("Stored password:", user.password);

    const passwordMatch = await bcrypt.compare(password, user.password);

    console.log("Password match:", passwordMatch);

    if(passwordMatch){
        return user.id;
    } else {
        throw new Error("Failed to log in  ");
    }
}

export default {register, login};