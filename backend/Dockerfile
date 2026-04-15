FROM python:3.14-slim

WORKDIR /app

# Copy requirements file to leverage Docker cache
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the correct port
EXPOSE 5001

# Run the Flask app
CMD ["python", "app.py"]
