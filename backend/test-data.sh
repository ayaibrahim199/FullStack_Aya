#!/bin/bash

# Smart Appointment Booking System - API Test Data
# This script provides sample data and commands to test all endpoints

BASE_URL="http://localhost:8080/api/auth"

echo "=========================================="
echo "Smart Appointment Booking System - Test Data"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Register a Student
echo -e "${BLUE}1. REGISTER STUDENT${NC}"
echo "Request:"
echo "curl -X POST $BASE_URL/signup \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"username\":\"john_student\",\"password\":\"password123\",\"role\":[\"student\"]}'"
echo ""
echo "Response:"
STUDENT_1=$(curl -s -X POST $BASE_URL/signup \
  -H 'Content-Type: application/json' \
  -d '{"username":"john_student","password":"password123","role":["student"]}')
echo "$STUDENT_1"
echo ""
echo ""

# Test 2: Register Another Student
echo -e "${BLUE}2. REGISTER ANOTHER STUDENT${NC}"
echo "Request:"
echo "curl -X POST $BASE_URL/signup \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"username\":\"jane_student\",\"password\":\"password456\",\"role\":[\"student\"]}'"
echo ""
echo "Response:"
STUDENT_2=$(curl -s -X POST $BASE_URL/signup \
  -H 'Content-Type: application/json' \
  -d '{"username":"jane_student","password":"password456","role":["student"]}')
echo "$STUDENT_2"
echo ""
echo ""

# Test 3: Register a Teacher
echo -e "${BLUE}3. REGISTER TEACHER${NC}"
echo "Request:"
echo "curl -X POST $BASE_URL/signup \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"username\":\"mr_smith_teacher\",\"password\":\"teacher123\",\"role\":[\"teacher\"]}'"
echo ""
echo "Response:"
TEACHER_1=$(curl -s -X POST $BASE_URL/signup \
  -H 'Content-Type: application/json' \
  -d '{"username":"mr_smith_teacher","password":"teacher123","role":["teacher"]}')
echo "$TEACHER_1"
echo ""
echo ""

# Test 4: Register Another Teacher
echo -e "${BLUE}4. REGISTER ANOTHER TEACHER${NC}"
echo "Request:"
echo "curl -X POST $BASE_URL/signup \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"username\":\"ms_johnson_teacher\",\"password\":\"teacher456\",\"role\":[\"teacher\"]}'"
echo ""
echo "Response:"
TEACHER_2=$(curl -s -X POST $BASE_URL/signup \
  -H 'Content-Type: application/json' \
  -d '{"username":"ms_johnson_teacher","password":"teacher456","role":["teacher"]}')
echo "$TEACHER_2"
echo ""
echo ""

# Test 5: Login Student
echo -e "${BLUE}5. LOGIN STUDENT (john_student)${NC}"
echo "Request:"
echo "curl -X POST $BASE_URL/signin \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"username\":\"john_student\",\"password\":\"password123\"}'"
echo ""
echo "Response:"
STUDENT_TOKEN=$(curl -s -X POST $BASE_URL/signin \
  -H 'Content-Type: application/json' \
  -d '{"username":"john_student","password":"password123"}' | jq -r '.token')
echo "Token received: $STUDENT_TOKEN"
echo ""
echo ""

# Test 6: Login Teacher
echo -e "${BLUE}6. LOGIN TEACHER (mr_smith_teacher)${NC}"
echo "Request:"
echo "curl -X POST $BASE_URL/signin \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"username\":\"mr_smith_teacher\",\"password\":\"teacher123\"}'"
echo ""
echo "Response:"
TEACHER_TOKEN=$(curl -s -X POST $BASE_URL/signin \
  -H 'Content-Type: application/json' \
  -d '{"username":"mr_smith_teacher","password":"teacher123"}' | jq -r '.token')
echo "Token received: $TEACHER_TOKEN"
echo ""
echo ""

# Test 7: Invalid Login
echo -e "${BLUE}7. INVALID LOGIN (wrong password)${NC}"
echo "Request:"
echo "curl -X POST $BASE_URL/signin \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"username\":\"john_student\",\"password\":\"wrongpassword\"}'"
echo ""
echo "Response (should fail):"
curl -s -X POST $BASE_URL/signin \
  -H 'Content-Type: application/json' \
  -d '{"username":"john_student","password":"wrongpassword"}'
echo ""
echo ""
echo ""

# Summary
echo -e "${GREEN}=========================================="
echo "TEST DATA SUMMARY"
echo "==========================================${NC}"
echo ""
echo -e "${YELLOW}Students Created:${NC}"
echo "  1. Username: john_student | Password: password123"
echo "  2. Username: jane_student | Password: password456"
echo ""
echo -e "${YELLOW}Teachers Created:${NC}"
echo "  1. Username: mr_smith_teacher | Password: teacher123"
echo "  2. Username: ms_johnson_teacher | Password: teacher456"
echo ""
echo -e "${YELLOW}JWT Tokens for Testing:${NC}"
echo "  Student Token: $STUDENT_TOKEN"
echo "  Teacher Token: $TEACHER_TOKEN"
echo ""
echo -e "${YELLOW}Test with curl:${NC}"
echo "  curl -H 'Authorization: Bearer <TOKEN>' http://localhost:8080/api/protected-endpoint"
echo ""
