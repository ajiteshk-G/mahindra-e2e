from app.routers.health import router as health_router
from app.routers.catalog import router as catalog_router
from app.routers.customer import router as customer_router
from app.routers.bookings import router as bookings_router
from app.routers.kyc import router as kyc_router
from app.routers.diagnostics import router as diagnostics_router
from app.routers.telematics import router as telematics_router
from app.routers.sales_recording import router as sales_router
from app.routers.outbound_call import router as outbound_router
from app.routers.financing import router as financing_router
from app.routers.ws_live import router as ws_router

__all__ = [
    "health_router",
    "catalog_router",
    "customer_router",
    "bookings_router",
    "kyc_router",
    "diagnostics_router",
    "telematics_router",
    "sales_router",
    "outbound_router",
    "financing_router",
    "ws_router"
]
