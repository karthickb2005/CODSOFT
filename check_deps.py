try:
    import httpx
    print("httpx imported successfully")
except Exception:
    print("Error importing httpx:")
    import traceback
    traceback.print_exc()

try:
    import googletrans
    print("googletrans imported successfully")
except Exception:
    print("Error importing googletrans:")
    import traceback
    traceback.print_exc()
