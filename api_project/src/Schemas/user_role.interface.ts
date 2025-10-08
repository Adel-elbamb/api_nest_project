// // src/users/interfaces/user_role.interface.ts

// //  Define the interface for typing
// export interface UserRole {
//     USER: 'user';
//     ADMIN: 'admin';
// }

// //  Create an actual constant to use in schemas
// export const USER_ROLE: UserRole = {
//     USER: 'user',
//     ADMIN: 'admin',
// } as const;


export enum UserRole {
    USER = 'user',
    ADMIN = 'admin',
}