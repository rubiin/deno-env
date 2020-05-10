import * as dotenv from './mod.ts'



console.log(dotenv.config({debug:true}))
console.log(Deno.env.get('PASSWORD'))
