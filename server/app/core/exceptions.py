from fastapi import HTTPException, status


class InvalidTokenError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or already-used token")


class ExpiredTokenError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail="Token has expired")


class RateLimitedError(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="A magic link was already requested for this email. Please wait before requesting another.",
        )


class NotAuthenticatedError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")


class ForbiddenError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to perform this action")


class QuizNotFoundError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")


class UserNotFoundError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")


class CannotDeleteSelfError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot delete your own account")


class UnsupportedFileTypeError(HTTPException):
    def __init__(self, detail: str = "Only PDF or DOCX files are supported."):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class DocumentTooShortError(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This document doesn't have enough readable text to generate a quiz. Please try a different file.",
        )


class DocumentTooLongError(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This document is too long to generate a quiz from. Please try a shorter document or split it into smaller sections.",
        )


class AIGenerationFailedError(HTTPException):
    def __init__(self, detail: str = "The quiz could not be generated. Please try again."):
        super().__init__(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail)


class GenerationRateLimitedError(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="You're generating quizzes too quickly. Please wait a moment and try again.",
        )