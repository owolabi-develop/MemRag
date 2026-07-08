import os




class BaseConnector:

    async def authenticate(self):
        pass
    
    async def download_file(self,file_id:str):
        raise NotImplementedError
    
    async def list_file(self):
        raise NotImplementedError
    
    

class GoogleDriverConnector(BaseConnector):
    pass


class OneDriveConnector(BaseConnector):
    pass

class S3Connector(BaseConnector):
    pass

