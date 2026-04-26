package handlers

import (
	"chatta/backend/internal/auth"
	"chatta/backend/internal/db"
	"chatta/backend/models"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// Signup registers a new user.
func Signup(c *fiber.Ctx) error {
	client := new(models.User)
	client.UUID = uuid.New().String()

	if err := c.BodyParser(client); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot parse JSON",
		})
	}

	if err := db.DB.First(&client, "username = ?", client.Username).Error; err == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "User Already Exists"})
	}

	hashpass, err := bcrypt.GenerateFromPassword([]byte(client.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error encrypting password": err.Error()})
	}
	client.Password = string(hashpass)

	if err := db.DB.Create(&client).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	client.Password = ""

	token, err := auth.GenerateToken(client.Username)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create token"})
	}

	return c.JSON(fiber.Map{"token": token, "user": client})
}

// Login authenticates a user and returns a JWT token.
func Login(c *fiber.Ctx) error {
	type Credentials struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	type ResponseUser struct {
		UUID     string `json:"uuid"`
		Username string `json:"username"`
	}

	var creds Credentials
	var users models.User

	if err := c.BodyParser(&creds); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if err := db.DB.Where("username = ?", creds.Username).First(&users).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	err := bcrypt.CompareHashAndPassword([]byte(users.Password), []byte(creds.Password))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid Credentials"})
	}

	token, err := auth.GenerateToken(creds.Username)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create token"})
	}

	c.Locals("username", creds.Username)
	response := ResponseUser{
		UUID:     users.UUID,
		Username: users.Username,
	}

	return c.JSON(fiber.Map{"token": token, "user": response})
}
