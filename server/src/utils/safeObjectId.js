import { ObjectId } from "mongodb";

export const toObjectId = (value, fieldName = "id") => {
    if (!value || !ObjectId.isValid(value)) {
        throw new Error(`Invalid ${fieldName}`);
    }
    return new ObjectId(value);
};
