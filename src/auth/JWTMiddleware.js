import createError from "http-errors";
import { verifyAccessToken } from "./tools.js";

// export const JWTAuthMiddleware = async (req, res, next) => {
//   if (!req.headers.authorization) {
//     next(createError(401, "Please provide bearer token in authorization header"))
//   } else {
//     try {
//       const token = req.headers.authorization.replace("Bearer ", "")

//       const payload = await verifyAccessToken(token)

//       req.user = {
//         _id: payload._id,
//         name: payload.name
//       }
//       next()
//     } catch (error) {
//       next(createError(401, "Token is not valid!"))
//     }
//   }
// }

export const JWTAuthMiddleware = async (req, res, next) => {
  if (!req.cookies.accessToken) {
    next(createError(401, "Please send access token in cookies"));
  } else {
    try {
      const token = req.cookies.accessToken;

      const payload = await verifyAccessToken(token);

      req.user = {
        _id: payload._id,
        username: payload.username,
      };
      next();
    } catch (error) {
      next(createError(401, "Token is not valid!"));
    }
  }
};
