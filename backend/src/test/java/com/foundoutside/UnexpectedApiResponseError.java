package com.foundoutside;

class UnexpectedApiResponseError extends AssertionError {
    UnexpectedApiResponseError(String message) {
        super(message);
    }
}
