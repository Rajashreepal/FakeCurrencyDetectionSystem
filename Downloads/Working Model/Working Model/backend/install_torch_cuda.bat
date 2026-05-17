@echo off
echo This installs CUDA-enabled PyTorch for many RTX 30-series laptops. If it fails, use https://pytorch.org/get-started/locally/ for the latest command.
python -m pip install --upgrade pip
python -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
python -m pip install onnxruntime-gpu
