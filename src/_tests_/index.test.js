import app from '../app.js'
import supertest from "supertest"
import mongoose from 'mongoose'
import dotenv from "dotenv"

dotenv.config()

const client = supertest(app)


describe("Testing the environment", () => {

    beforeAll(async () => {
        console.log("beforeAll")
        await mongoose.connect(process.env.MONGO_URL_TEST)
    })

    it("Should test that the test endpoint is returning a success message", async () => {
        const response = await client.get("/test")

        console.table(response.body)
        expect(response.body.message).toBe("Hello, World!")
    })


    const validUser = {
        "username": "Test",
        "email": "guest@gmail.com",
        "password": "test."
    }

    it("should test than when registering a new user we are receiving a 201 status and a user id", async () => {
        const response = await client.post("/users/account").send(validUser)

        expect(response.status).toBe(201)

        console.table(response.body)
        expect(response.body._id).toBeDefined()

    })

    const invalidUser = {
        name: "100"
    }

    it("should test that when registering a new user with invalid data we receive 400", async () => {

        const response = await client.post("/users/account").send(invalidUser)

        expect(response.status).toBe(400)
    })

    const validAccess = {
        "email": "guest@gmail.com",
        "password": "test."
    }

    it("should test than when login we are receiving a 200 status", async () => {
        const response = await client.post("/users/session").send(validAccess)

        expect(response.status).toBe(200)

    })

    const invalidAccess = {
        "email": "gues",
        "password": "te."
    }

    it("should test that when login with invalid data we receive 400", async () => {

        const response = await client.post("/users/session").send(invalidAccess)

        expect(response.status).toBe(401)
    })

    it("should test that when searching user by query without accessToken we are not retrieving the data and getting a 401 status", async () => {

        const response = await client.get("/users?q=m")

        expect(response.status).toBe(401)
    })

    it("should test that when accessing our personal data without accessToken we are not retrieving the data and getting a 401 status", async () => {

        const response = await client.get("/users/me")

        expect(response.status).toBe(401)
    })

    const existingId = "626fa972987d20be71eed34e"

    it("should test than when accessing single user data with id  without accessToken we are not retrieving the data and getting a 401 status", async () => {
        const response = await client.get(`/users/${existingId}`)

        expect(response.status).toBe(401)

    })


    afterAll(async () => {
        console.log("afterAll")
        // await mongoose.connection.dropDatabase()
        await mongoose.connection.close()
    })

})