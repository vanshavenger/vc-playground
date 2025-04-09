export interface FileSystem {
    id : number
    name: string
    isFolder: boolean
    children?: FileSystem[]
}