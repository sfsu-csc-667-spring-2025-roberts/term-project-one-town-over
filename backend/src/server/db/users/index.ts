import db from "../connection"
import bcrypt from "bcrypt";

const register = async (email: string, password:string) => {
    
    const encryptedPassword = await bcrypt.hash(password, 10);

    const {id} = await db.one("INSERT INTO usertest (email, password) VALUES ($1, $2) RETURNING id", [email, encryptedPassword]);

    return {id, email};
};

const login = async (email: string, password:string ) => {

    const {id, password: encryptedPassword} = await db.one("SELECT id, email, password FROM usertest WHERE email = $1", [email]);

    console.log("User from DB:", id);
    console.log("Input password:", password);
    console.log("Stored password:",     encryptedPassword);

    const passwordMatch = await bcrypt.compare(password, encryptedPassword);

    console.log("Password match:", passwordMatch);

    if(passwordMatch){
        return {id, email};
    } else {
        throw new Error("Failed to log in  ");
    }
}

export default {register, login};