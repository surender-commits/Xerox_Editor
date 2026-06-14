# Xerox Editor

A lightweight desktop image editor designed for document correction, scanning, and perspective adjustment.

Built with Neutralino.js, Xerox Editor provides an intuitive interface for transforming photos of documents into clean, properly aligned images without requiring heavy image editing software.

Perfect for scanned documents, receipts, notes, forms, certificates, and mobile-captured paperwork.

---

# Features

* Interactive perspective correction
* Four-point document cropping
* Edge-based crop adjustment
* Image rotation controls
* Brightness adjustment
* Contrast adjustment
* Grayscale mode
* Zoom and pan navigation
* Save edited image as a new file
* Reset individual tools
* Reset all modifications
* Drag-and-drop style editing workflow
* Lightweight desktop application
* Supports common image formats

---

## Screenshots

![Main Editor](screenshots/1.jpg)

![Main Editor](screenshots/1.jpg)

![Main Editor](screenshots/1.jpg)

---

# Supported Formats

## Input

```text
JPG
JPEG
PNG
WEBP
BMP
GIF
TIFF
```

## Output

```text
JPG
PNG
```

(depending on original format and save settings)

---

# Use Cases

### Document Scanning

Transform photos of documents into clean scanned copies.

```text
Phone Photo
      ↓
Perspective Correction
      ↓
Brightness & Contrast Fix
      ↓
Save Clean Document
```

---

### Receipt Cleanup

Correct angled receipt photos for easier storage and sharing.

---

### Form Processing

Straighten and crop photographed forms before printing or uploading.

---

### Certificate & ID Cleanup

Remove unwanted background areas and focus only on the document.

---

# Key Editing Tools

## Perspective Correction

Adjust all four corners independently to correct camera distortion.

```text
Before
╱─────╲
│     │
╲─────╱

After
┌─────┐
│     │
└─────┘
```

Perfect for:

* Scanned documents
* Receipts
* Certificates
* Paper forms

---

## Crop Tool

Resize the document area using:

* Corner handles
* Edge handles

to remove unwanted background content.

---

## Rotation

Rotate images:

* Clockwise
* Counter-clockwise
* Reset rotation

for proper alignment.

---

## Brightness Control

Increase or decrease image brightness to improve readability.

Useful for:

* Dark photos
* Poor lighting conditions
* Shadow correction

---

## Contrast Control

Adjust contrast for better text visibility and cleaner document appearance.

---

## Grayscale Mode

Convert documents into grayscale for:

* Reduced distractions
* Cleaner document appearance
* Printing purposes

---

# Navigation Controls

## Zoom

Use the mouse wheel to zoom in and out.

```text
Scroll Up   → Zoom In
Scroll Down → Zoom Out
```

---

## Pan

Hold:

```text
Space
```

and drag the mouse to move around large images.

---

# How It Works

```text
Image File
     ↓
Load Image
     ↓
Perspective Correction
     ↓
Crop Adjustments
     ↓
Brightness / Contrast
     ↓
Rotation
     ↓
Optional Grayscale
     ↓
Save as New Image
```

---

# Technology Stack

## Neutralino.js

Provides the desktop application framework.

Used for:

* Native window management
* File system access
* Cross-platform desktop deployment

---

## HTML

Responsible for:

* Application structure
* User interface layout

---

## CSS

Responsible for:

* Styling
* Responsive editor layout
* Visual controls

---

## JavaScript

Responsible for:

* Canvas rendering
* Perspective transformations
* Crop calculations
* Image processing
* Save operations
* User interactions

---

# Project Structure

```text
Xerox_Editor/
│
├── Xerox_Editor.exe
├── neutralino.config.json
├── icon.ico
│
└── resources/
    │
    ├── index.html
    ├── script.js
    ├── style.css
    ├── neutralino.js
    │
    ├── appIcon.png
    └── favicon.ico
```

---

# User Workflow

1. Launch Xerox Editor.
2. Open an image.
3. Adjust perspective using corner handles.
4. Fine-tune crop boundaries.
5. Rotate if required.
6. Adjust brightness and contrast.
7. Enable grayscale if desired.
8. Click:

```text
Save as New
```

9. Export the corrected image.

---

# Performance Features

* Lightweight runtime
* No external image processing services
* Local image editing
* Fast canvas rendering
* Real-time adjustment preview
* Minimal memory footprint

---

# Advantages

* Lightweight alternative to large image editors
* Designed specifically for document correction
* Fast workflow
* Offline processing
* Interactive perspective editing
* Simple user interface
* Portable executable

---

# Requirements

* Windows 10 or Windows 11
