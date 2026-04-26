package handlers

import (
	"chatta/backend/internal/db"
	"chatta/backend/models"
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// GetChats returns all chats with participants.
func GetChats(c *fiber.Ctx) error {
	chats := []models.Chat{}
	if err := db.DB.Preload("Participants").Find(&chats).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(chats)
}

// GetChat returns a single chat by UUID with messages.
func GetChat(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	if uuid == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "UUID parameter is missing",
		})
	}

	var chat models.Chat
	if err := db.DB.Preload("Messages").Preload("Sender").Where("uuid = ?", uuid).First(&chat).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Chat not found",
			})
		}
		fmt.Printf("Database error: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Internal server error",
		})
	}

	return c.JSON(chat)
}

// CreateThread creates a new thread/group chat.
func CreateThread(c *fiber.Ctx) error {
	var tempChat models.Chat
	if err := c.BodyParser(&tempChat); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request",
		})
	}

	tempChat.UUID = uuid.New().String()
	if err := db.DB.Create(&tempChat).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{"chat": tempChat})
}

// GetDM retrieves or creates a DM conversation between two users.
func GetDM(c *fiber.Ctx) error {
	var tempChat models.Chat
	if err := c.BodyParser(&tempChat); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Invalid request payload"})
	}

	if len(tempChat.Participants) < 2 {
		return c.Status(400).JSON(fiber.Map{"error": "Need exactly 2 participants"})
	}

	participant1UUID := tempChat.Participants[0].UUID
	participant2UUID := tempChat.Participants[1].UUID

	var existingChat models.Chat
	if err := db.DB.Preload("Messages").Preload("Messages.Sender").Preload("Participants").
		Joins("JOIN dm_participants ON dm_participants.chat_uuid = chats.uuid").
		Where("chats.type = ? AND dm_participants.user_uuid IN (?, ?)", "dm", participant1UUID, participant2UUID).
		Group("chats.uuid").
		Having("COUNT(DISTINCT dm_participants.user_uuid) = 2").First(&existingChat).Error; err == nil {
		fmt.Println("DM already exists")
		return c.Status(200).JSON(existingChat)
	}

	fmt.Println("Creating new DM")
	tempChat.UUID = uuid.New().String()
	tempChat.Type = "dm"

	var participant1, participant2 models.User
	if err := db.DB.Where("uuid = ?", participant1UUID).First(&participant1).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}
	if err := db.DB.Where("uuid = ?", participant2UUID).First(&participant2).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	tempChat.Participants = []models.User{participant1, participant2}

	if err := db.DB.Create(&tempChat).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create new DM chat"})
	}

	return c.Status(201).JSON(tempChat)
}

// GetMessages returns all messages (with sender info).
func GetMessages(c *fiber.Ctx) error {
	messages := []models.Message{}

	if err := db.DB.Preload("Sender").Find(&messages).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(messages)
}
