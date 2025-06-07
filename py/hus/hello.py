import tornado.web
import tornado.ioloop
class basicRequestHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("Hello, Wddaorld!")

if __name__ == "__main__":
    app = tornado.web.Application([
        (r"/", basicRequestHandler),
    ])
    app.listen(8888)
    print("Server is running on http://localhost:8888")
    tornado.ioloop.IOLoop.current().start()