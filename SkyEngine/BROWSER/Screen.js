/*
 * 게임 화면 전체를 다루는 오브젝트
 */
SkyEngine.Screen = OBJECT({
	
	preset : () => {
		return SkyEngine.Node;
	},
	
	init : (inner, self) => {
		
		let wrapper = DIV({
			style : {
				position : 'fixed',
				left : 0,
				top : 0
			}
		}).appendTo(BODY);
		
		let canvas = CANVAS().appendTo(wrapper);
		let context = canvas.getContext('2d');
		
		let canvasWidth;
		let canvasHeight;
		
		let deltaTime;
		
		let registeredNodeMap = {};
		let registeredEventNodeMap = {};
		
		let registerNode = self.registerNode = (node) => {
			
			let cls = node.type;
			
			while (cls !== undefined && cls !== CLASS) {
				
				if (registeredNodeMap[cls.id] === undefined) {
					registeredNodeMap[cls.id] = [];
				}
				
				registeredNodeMap[cls.id].push(node);
				
				cls = cls.mom;
			}
		};
		
		let unregisterNode = self.unregisterNode = (node) => {
			
			let cls = node.type;
			
			while (cls !== undefined && cls !== CLASS) {
				
				if (registeredNodeMap[cls.id] !== undefined) {
					
					REMOVE({
						array : registeredNodeMap[cls.id],
						value : node
					});
					
					if (registeredNodeMap[cls.id].length === 0) {
						delete registeredNodeMap[cls.id];
					}
				}
				
				cls = cls.mom;
			}
		};
		
		let getRegisteredNodes = self.getRegisteredNodes = (cls) => {
			return registeredNodeMap[cls.id] === undefined ? [] : registeredNodeMap[cls.id];
		};
		
		let registerEventNode = self.registerEventNode = (eventName, node) => {
			
			if (registeredEventNodeMap[eventName] !== undefined) {
				registeredEventNodeMap[eventName].push(node);
			}
		};
		
		let unregisterEventNode = self.unregisterEventNode = (eventName, node) => {
			
			if (registeredEventNodeMap[eventName] !== undefined) {
				
				REMOVE({
					array : registeredEventNodeMap[eventName],
					value : node
				});
			}
		};
		
		let setFilter = self.setFilter = (filterStyle) => {
			//REQUIRED: filterStyle
			
			canvas.addStyle({
				filter : filterStyle
			});
		};
		
		let removeFilter = self.removeFilter = () => {
			setFilter('none');
		};
		
		
		if (CONFIG.isDevMode === true) {
			
			let fpsDom = DIV({
				style : {
					position : 'fixed',
					left : 5,
					top : 5,
					fontSize : 12
				}
			}).appendTo(BODY);
			
			INTERVAL(0.1, () => {
				
				if (deltaTime !== undefined) {
					fpsDom.empty();
					fpsDom.append('FPS: ' + parseInt(1 / deltaTime * 1000));
				}
			});
		}
		
		EACH([
			'tap',
			'touchstart',
			'touchend'
		], (eventName) => {
			
			registeredEventNodeMap[eventName] = [];
			
			canvas.on(eventName, (e) => {
				
				EACH(registeredEventNodeMap[eventName], (node) => {
					
					if (node.checkTouch(e.getLeft(), e.getTop()) === true) {
						node.fireEvent(eventName);
					}
				});
				
				e.stop();
			});
		});
		
		let stepAll = (node, deltaTime) => {
			
			node.step(deltaTime);
			
			node.getChildren().forEach((childNode) => {
				stepAll(childNode, deltaTime);
			});
		};
		
		let drawAll = (node, context, realX, realY, realScaleX, realScaleY, realRadian, realAlpha) => {
			
			let plusX = node.getX() * realScaleX;
			let plusY = node.getY() * realScaleY;
			
			let plusCenterX = node.getCenterX() * realScaleX;
			let plusCenterY = node.getCenterY() * realScaleY;
			
			let sin = Math.sin(realRadian);
			let cos = Math.cos(realRadian);
			
			realX += plusX * cos - plusY * sin;
			realY += plusX * sin + plusY * cos;
			
			let nextX = realX;
			let nextY = realY;
			
			realScaleX *= node.getScaleX();
			realScaleY *= node.getScaleY();
			
			realRadian += node.getAngle() * Math.PI / 180;
			
			sin = Math.sin(realRadian);
			cos = Math.cos(realRadian);
			
			realX -= plusCenterX * cos - plusCenterY * sin;
			realY -= plusCenterX * sin + plusCenterY * cos;
			
			realAlpha *= node.getAlpha();
			
			if (node.checkIsHiding() !== true) {
				
				context.translate(realX, realY);
				context.rotate(realRadian);
				context.scale(realScaleX, realScaleY);
				context.globalAlpha = realAlpha;
				
				node.draw(context, realX, realY, realScaleX, realScaleY, realRadian, realAlpha);
				
				context.globalAlpha = 1;
				context.scale(1 / realScaleX, 1 / realScaleY);
				context.rotate(-realRadian);
				context.translate(-realX, -realY);
				
				node.getChildren().forEach((childNode) => {
					drawAll(childNode, context, nextX, nextY, realScaleX, realScaleY, realRadian, realAlpha);
				});
			}
		};
		
		let loop = LOOP((_deltaTime) => {
			
			deltaTime = _deltaTime;
			
			stepAll(self, deltaTime);
			
			context.clearRect(0, 0, canvasWidth, canvasHeight);
			
			drawAll(self, context, canvasWidth / 2, canvasHeight / 2, self.getScaleX(), self.getScaleY(), self.getAngle() * Math.PI / 180, self.getAlpha());
		});
		
		EVENT('resize', RAR(() => {
			
			canvasWidth = WIN_WIDTH();
			canvasHeight = WIN_HEIGHT();
			
			canvas.setSize({
				width : canvasWidth,
				height : canvasHeight
			});
		}));
		
		self.on('remove', () => {
			loop.remove();
		});
	}
});
