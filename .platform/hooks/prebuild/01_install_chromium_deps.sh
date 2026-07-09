#!/bin/bash
sudo dnf install -y atk cups-libs gtk3 libXcomposite libXcursor libXdamage \
  libXext libXi libXrandr libXScrnSaver libXtst pango alsa-lib nss at-spi2-atk

# Native build dependencies for the `canvas` package (used by chartjs-node-canvas)
sudo dnf install -y gcc-c++ make cairo-devel pango-devel libjpeg-turbo-devel \
  giflib-devel librsvg2-devel pixman-devel pkgconf-pkg-config
