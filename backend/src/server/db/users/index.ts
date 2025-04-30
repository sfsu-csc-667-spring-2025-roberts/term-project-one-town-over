import db from "../connection"
import bcrypt from "bcrypt";

export type User = {
    id:number;
    email: string;
    password: string;
};

const register = async (email: string, password:string, username:string) => {    
    const encryptedPassword = await bcrypt.hash(password, 10);

    // const {id} = await db.one("INSERT INTO users (email, password) VALUES ($1, $2)", [email, encryptedPassword]);
    await db.none("INSERT INTO users (email, password, username, avatar) VALUES ($1, $2, $3, 'avatar.png')", [email, encryptedPassword, username]);

    const user = await db.one<User>("SELECT * FROM users WHERE email = $1", [email]);

    // return id;
    return user;
};

const login = async (email: string, password:string ) => {

    const user = await db.one<User>("SELECT * FROM users WHERE email = $1", [email]);

    const passwordMatch = await bcrypt.compare(password, user.password);

    if(passwordMatch){
        // return user.id;
        return user;
    } else {
        throw new Error("Failed to log in  ");
    }
}

export default {register, login};