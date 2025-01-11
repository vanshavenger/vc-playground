export const JWT_SECRET = process.env.JWT_SECRET ?? 'secret'
export const BCRYPT_SALT = Number(process.env.BCRYPT_SALT) ?? 10

export const HTPP_BACKEND_PORT = Number(process.env.HTTP_BACKEND_PORT) ?? 8081
export const WS_BACKEND_PORT = Number(process.env.WS_BACKEND_PORT) ?? 8080
