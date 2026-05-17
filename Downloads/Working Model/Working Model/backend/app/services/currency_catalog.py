from __future__ import annotations
SUPPORTED = {
    "INR": {"name":"Indian Rupee", "symbol":"₹", "mode":"authenticity_model", "denominations":["10","20","50","100","200","500","2000"]},
    "USD": {"name":"US Dollar", "symbol":"$", "mode":"denomination_model_plus_authenticity_engine", "denominations":["1","2","5","10","20","50","100"]},
    "EUR": {"name":"Euro", "symbol":"€", "mode":"advanced_authenticity_engine", "denominations":["5","10","20","50","100","200","500"]},
    "GBP": {"name":"Pound Sterling", "symbol":"£", "mode":"advanced_authenticity_engine", "denominations":["5","10","20","50"]},
    "OTHER": {"name":"Other / Generic", "symbol":"¤", "mode":"advanced_authenticity_engine", "denominations":[]},
}

def normalize_currency(code: str | None) -> str:
    if not code:
        return "OTHER"
    c = code.strip().upper()
    if c in {"DOLLAR", "US", "USA", "US DOLLAR"}: return "USD"
    if c in {"RUPEE", "INDIA", "INDIAN RUPEE"}: return "INR"
    if c in {"POUND", "STERLING", "UK"}: return "GBP"
    if c in {"EUROPE", "EURO"}: return "EUR"
    return c if c in SUPPORTED else "OTHER"
