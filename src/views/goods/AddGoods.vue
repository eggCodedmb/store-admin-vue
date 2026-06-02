<template>
  <div class="add-goods-container">
    <el-card class="box-card" v-loading="pageLoading">
      <template #header>
        <div class="card-header">
          <span class="title">{{ isEdit ? "编辑商品" : "添加商品" }}</span>
          <el-button type="primary" link @click="$router.back()">
            <el-icon><ArrowLeft /></el-icon>返回列表
          </el-button>
        </div>
      </template>

      <el-form
        ref="goodsFormRef"
        :model="goodsForm"
        :rules="rules"
        label-width="100px"
        class="goods-form"
        label-position="top"
      >
        <el-scrollbar class="form-scrollbar">
          <div class="form-content">
            <el-form-item label="商品名称" prop="goods_name">
              <el-input
                v-model="goodsForm.goods_name"
                placeholder="请输入商品名称"
                clearable
              />
            </el-form-item>

            <el-form-item label="所属门店" prop="store_id">
              <el-select
                v-model="goodsForm.store_id"
                placeholder="请选择所属门店"
                style="width: 100%"
                :disabled="isEdit"
              >
                <el-option
                  v-for="item in filteredStoreOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
              <div class="tip-text" v-if="isAdmin && !isEdit">
                请选择要发布该商品的门店
              </div>
              <div class="tip-text" v-else-if="!isAdmin">
                只能在您所属的门店发布商品
              </div>
            </el-form-item>

            <el-form-item label="商品分类" prop="category_ids">
              <el-select
                v-model="goodsForm.category_ids"
                multiple
                placeholder="请选择商品分类"
                style="width: 100%"
                collapse-tags
                collapse-tags-indicator
              >
                <el-option
                  v-for="item in categoryOptions"
                  :key="item.id"
                  :label="item.category_name"
                  :value="item.id"
                />
              </el-select>
              <div class="tip-text">可以在“分类管理”中创建更多分类</div>
            </el-form-item>

            <el-row :gutter="40">
              <el-col :span="12">
                <el-form-item label="商品价格 (元)" prop="goods_price">
                  <el-input-number
                    v-model="goodsForm.goods_price"
                    :precision="2"
                    :step="0.1"
                    :min="0"
                    style="width: 100%"
                    controls-position="right"
                  ></el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="商品库存 (件)" prop="goods_num">
                  <el-input-number
                    v-model="goodsForm.goods_num"
                    :min="1"
                    style="width: 100%"
                    controls-position="right"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 商品规格维护 -->
            <div class="spec-section">
              <div class="section-title">
                <span>商品规格</span>
                <div class="section-actions">
                  <el-dropdown
                    @command="handleSelectCommonSpec"
                    trigger="click"
                    style="margin-right: 12px"
                  >
                    <el-button type="success" plain size="small">
                      从规格库选择<el-icon class="el-icon--right"
                        ><ArrowDown
                      /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item
                          v-if="commonSpecs.length === 0"
                          disabled
                          >规格库为空</el-dropdown-item
                        >
                        <el-dropdown-item
                          v-for="item in commonSpecs"
                          :key="item.id"
                          :command="item"
                        >
                          {{ item.name }}
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                  <el-button type="primary" link @click="addSpecGroup">
                    <el-icon><Plus /></el-icon>添加自定义规格
                  </el-button>
                </div>
              </div>

              <el-scrollbar max-height="400px">
                <div style="padding-right: 12px">
                  <div v-if="goodsForm.specs.length === 0" class="empty-spec">
                    暂无规格，点击上方按钮从规格库选择或添加自定义规格
                  </div>

                  <div
                    v-for="(group, gIndex) in goodsForm.specs"
                    :key="gIndex"
                    class="spec-group-item"
                  >
                    <div class="group-header">
                      <div class="group-info">
                        <el-tag
                          v-if="group.id"
                          type="success"
                          size="small"
                          effect="dark"
                          class="template-tag"
                          >模板</el-tag
                        >
                        <el-input
                          v-model="group.name"
                          placeholder="规格名称"
                          style="width: 240px"
                          :disabled="!!group.id"
                        />
                      </div>
                      <div class="group-actions">
                        <el-button
                          v-if="group.id"
                          type="warning"
                          link
                          @click="unbindTemplate(gIndex)"
                        >
                          <el-icon><Unlock /></el-icon>转为自定义
                        </el-button>
                        <el-button
                          type="danger"
                          link
                          @click="removeSpecGroup(gIndex)"
                        >
                          <el-icon><Delete /></el-icon>删除
                        </el-button>
                      </div>
                    </div>

                    <div class="options-container">
                      <el-table :data="group.options" border size="small">
                        <el-table-column label="选项名称" min-width="180">
                          <template #default="{ row }">
                            <el-input
                              v-model="row.name"
                              placeholder="选项名称"
                              :disabled="!!group.id"
                            />
                          </template>
                        </el-table-column>
                        <el-table-column label="价格增量 (元)" width="150">
                          <template #default="{ row }">
                            <el-input-number
                              v-model="row.price_delta"
                              :precision="2"
                              :step="1"
                              :min="0"
                              controls-position="right"
                              style="width: 100%"
                              :disabled="!!group.id"
                            />
                          </template>
                        </el-table-column>
                        <el-table-column label="操作" width="80" align="center">
                          <template #default="{ $index }">
                            <el-button
                              type="danger"
                              link
                              @click="removeSpecOption(gIndex, $index)"
                              :disabled="!!group.id"
                            >
                              <el-icon><Delete /></el-icon>
                            </el-button>
                          </template>
                        </el-table-column>
                      </el-table>
                      <div class="add-option-btn" v-if="!group.id">
                        <el-button
                          type="primary"
                          link
                          size="small"
                          @click="addSpecOption(gIndex)"
                        >
                          <el-icon><Plus /></el-icon>添加选项
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </el-scrollbar>
            </div>

            <el-form-item label="商品图片" prop="goods_img">
              <el-upload
                class="avatar-uploader"
                :action="baseURL + '/upload'"
                :show-file-list="false"
                :on-success="handleUploadSuccess"
                :before-upload="beforeUpload"
                :headers="uploadHeaders"
                name="file"
              >
                <div v-if="goodsForm.goods_img" class="avatar-container">
                  <img
                    :src="formatImageUrl(goodsForm.goods_img)"
                    class="avatar"
                  />
                  <div class="avatar-mask">
                    <el-icon><Edit /></el-icon>
                    <span class="mask-text">点击更换</span>
                  </div>
                </div>
                <div v-else class="uploader-placeholder">
                  <el-icon class="avatar-uploader-icon"><Plus /></el-icon>
                  <span>上传图片</span>
                </div>
              </el-upload>
              <div class="upload-tip">建议尺寸: 800x800, 大小不超过 2MB</div>
            </el-form-item>
          </div>
        </el-scrollbar>

        <div class="form-actions">
          <el-button
            type="primary"
            :loading="submitting"
            @click="submitForm"
            size="large"
            class="submit-btn"
          >
            {{ isEdit ? "保存修改" : "立即创建" }}
          </el-button>
          <el-button @click="resetForm" size="large">{{
            isEdit ? "撤销修改" : "重置"
          }}</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useUserStore } from "../../store/user";
import { getStoreList } from "../../api/store";
import { ElMessage } from "element-plus";
import {
  createGoods,
  getGoodsById,
  updateGoods,
  getGoodsDetail,
} from "../../api/goods";
import {
  getCategoryList,
  addGoodsToCategory,
  removeGoodsFromCategory,
} from "../../api/category";
import { getCommonSpecs } from "../../api/spec";
import { baseURL } from "../../utils/request";

const userStore = useUserStore();
const router = useRouter();
const route = useRoute();

const formatImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return baseURL + url;
};
const goodsFormRef = ref(null);
const submitting = ref(false);
const pageLoading = ref(false);
const categoryOptions = ref([]);
const storeOptions = ref([]);
const initialCategoryIds = ref([]);
const commonSpecs = ref([]);

const goodsId = computed(() => route.params.id);
const isEdit = computed(() => !!goodsId.value);

const uploadHeaders = {
  Authorization: `Bearer ${localStorage.getItem("token")}`,
};

const goodsForm = reactive({
  goods_name: "",
  goods_price: 0,
  goods_num: 1,
  goods_img: "",
  category_ids: [],
  store_id: "",
  specs: [],
});

const rules = {
  goods_name: [
    { required: true, message: "请输入商品名称", trigger: "blur" },
    { min: 2, max: 100, message: "长度在 2 到 100 个字符", trigger: "blur" },
  ],
  goods_price: [{ required: true, message: "请输入商品价格", trigger: "blur" }],
  goods_num: [{ required: true, message: "请输入商品库存", trigger: "blur" }],
  goods_img: [{ required: true, message: "请上传商品图片", trigger: "change" }],
  category_ids: [
    { required: true, message: "请选择至少一个分类", trigger: "change" },
  ],
  store_id: [{ required: true, message: "请选择所属门店", trigger: "change" }],
};

// 规格相关方法
const fetchCommonSpecs = async () => {
  try {
    const res = await getCommonSpecs();
    commonSpecs.value = res.result;
  } catch (error) {
    console.error("获取公共规格失败:", error);
  }
};

const handleSelectCommonSpec = (item) => {
  // 检查是否已经添加过该规格
  const exists = goodsForm.specs.some((s) => s.id === item.id);
  if (exists) {
    return ElMessage.warning("该规格已在列表中");
  }

  // 添加到列表，保持 id 以便后端识别为模板引用
  goodsForm.specs.push({
    id: item.id,
    name: item.name,
    options: item.spec_options.map((opt) => ({
      id: opt.id,
      name: opt.name,
      price_delta: Number(opt.price_delta),
    })),
  });
};

const unbindTemplate = (index) => {
  // 删除 id 属性，后端将视为自定义规格进行创建
  const spec = goodsForm.specs[index];
  delete spec.id;
  spec.options.forEach((opt) => delete opt.id);
  ElMessage.success("已转为自定义规格，现在可以自由编辑了");
};

const addSpecGroup = () => {
  goodsForm.specs.push({
    name: "",
    options: [{ name: "", price_delta: 0 }],
  });
};

const removeSpecGroup = (index) => {
  goodsForm.specs.splice(index, 1);
};

const addSpecOption = (groupIndex) => {
  goodsForm.specs[groupIndex].options.push({
    name: "",
    price_delta: 0,
  });
};

const removeSpecOption = (groupIndex, optionIndex) => {
  goodsForm.specs[groupIndex].options.splice(optionIndex, 1);
};

const isAdmin = computed(() => userStore.roles.includes("admin"));

const filteredStoreOptions = computed(() => {
  if (isAdmin.value) return storeOptions.value;
  const userDepts = userStore.userInfo?.departments || [];
  return storeOptions.value.filter((s) => userDepts.some((d) => d.id === s.id));
});

const fetchStores = async () => {
  try {
    const res = await getStoreList({ pageNum: 1, pageSize: 1000 });
    storeOptions.value = res.result.list || [];

    // 如果是新增且没有手动选择门店
    if (!isEdit.value && !goodsForm.store_id) {
      const depts = userStore.userInfo?.departments || [];
      if (!isAdmin.value && depts.length === 1) {
        goodsForm.store_id = depts[0].id;
      }
    }
  } catch (error) {
    console.error("获取门店列表失败:", error);
  }
};

const fetchCategories = async () => {
  try {
    const res = await getCategoryList();
    categoryOptions.value = res.result;
  } catch (error) {
    console.error("获取分类失败:", error);
  }
};

const fetchGoodsData = async () => {
  if (!isEdit.value) return;

  pageLoading.value = true;
  try {
    // 使用 getGoodsDetail 以获取规格信息
    const res = await getGoodsDetail(goodsId.value);
    const data = res.result;

    goodsForm.goods_name = data.goods_name;
    goodsForm.goods_price = Number(data.goods_price);
    goodsForm.goods_num = data.goods_num;
    goodsForm.goods_img = data.goods_img;
    goodsForm.store_id = data.store_id;

    // 后端返回的是 categories 数组
    const categoryIds = (data.categories || []).map((c) => c.id);
    goodsForm.category_ids = categoryIds;
    initialCategoryIds.value = [...categoryIds];

    // 填充规格数据
    if (data.spec_groups) {
      goodsForm.specs = data.spec_groups.map((group) => ({
        id: group.id,
        name: group.name,
        options: group.spec_options.map((opt) => ({
          id: opt.id,
          name: opt.name,
          price_delta: Number(opt.price_delta),
        })),
      }));
    }
  } catch (error) {
    ElMessage.error("获取商品详情失败");
    console.error(error);
  } finally {
    pageLoading.value = false;
  }
};

const handleUploadSuccess = (response) => {
  if (response.code === 0) {
    goodsForm.goods_img = response.result.url;
    ElMessage.success("图片上传成功");
  } else {
    ElMessage.error(response.message || "图片上传失败");
  }
};

const beforeUpload = (file) => {
  const isJPGorPNG = file.type === "image/jpeg" || file.type === "image/png";
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isJPGorPNG) {
    ElMessage.error("上传图片只能是 JPG 或 PNG 格式!");
  }
  if (!isLt2M) {
    ElMessage.error("上传图片大小不能超过 2MB!");
  }
  return isJPGorPNG && isLt2M;
};

const syncCategories = async (targetGoodsId) => {
  const currentIds = goodsForm.category_ids;
  const oldIds = initialCategoryIds.value;

  const toAdd = currentIds.filter((id) => !oldIds.includes(id));
  const toRemove = oldIds.filter((id) => !currentIds.includes(id));

  const promises = [
    ...toAdd.map((cid) => addGoodsToCategory(cid, targetGoodsId)),
    ...toRemove.map((cid) => removeGoodsFromCategory(cid, targetGoodsId)),
  ];

  await Promise.all(promises);
};

const submitForm = async () => {
  if (!goodsFormRef.value) return;

  await goodsFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true;
      try {
        // 数据清洗：剔除没有名称的规格组和选项
        const cleanedSpecs = goodsForm.specs
          .filter((group) => group.name && group.name.trim() !== "")
          .map((group) => ({
            ...group,
            options: group.options.filter(
              (opt) => opt.name && opt.name.trim() !== "",
            ),
          }));

        const payload = {
          goods_name: goodsForm.goods_name,
          goods_price: goodsForm.goods_price,
          goods_num: goodsForm.goods_num,
          goods_img: goodsForm.goods_img,
          store_id: goodsForm.store_id,
          specs: cleanedSpecs,
        };

        if (isEdit.value) {
          // 编辑模式
          await updateGoods(goodsId.value, payload);

          await syncCategories(goodsId.value);
          ElMessage.success("商品更新成功");
        } else {
          // 创建模式
          const res = await createGoods(payload);

          const newGoodsId = res.result.id;
          if (newGoodsId) {
            const categoryPromises = goodsForm.category_ids.map((cid) =>
              addGoodsToCategory(cid, newGoodsId),
            );
            await Promise.all(categoryPromises);
          }
          ElMessage.success("商品发布成功");
        }

        router.push("/goods_manage");
      } catch (error) {
        console.error("提交失败:", error);
      } finally {
        submitting.value = false;
      }
    }
  });
};

const resetForm = () => {
  if (isEdit.value) {
    fetchGoodsData();
  } else {
    if (!goodsFormRef.value) return;
    goodsFormRef.value.resetFields();
  }
};

onMounted(async () => {
  await fetchCategories();
  fetchStores();
  await fetchCommonSpecs();
  if (isEdit.value) {
    await fetchGoodsData();
  }
});
</script>

<style scoped>
.add-goods-container {
  padding: 24px;
  background-color: var(--el-bg-color-page);
  height: calc(100vh - 84px);
  display: flex;
  flex-direction: column;
}
.box-card {
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  border-radius: 12px;
  border: none;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}
:deep(.el-card__body) {
  flex: 1;
  overflow: hidden;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}
.card-header .title {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.goods-form {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.form-scrollbar {
  flex: 1;
}
.form-content {
  padding: 20px 40px;
}
.tip-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
.avatar-uploader :deep(.el-upload) {
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  background-color: var(--el-bg-color);
}
.avatar-uploader :deep(.el-upload:hover) {
  border-color: var(--el-color-primary);
  background-color: var(--el-bg-color-page);
}
.uploader-placeholder {
  width: 140px;
  height: 140px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--el-text-color-secondary);
}
.avatar-uploader-icon {
  font-size: 28px;
  margin-bottom: 8px;
}
.avatar-container {
  position: relative;
  width: 140px;
  height: 140px;
}
.avatar {
  width: 140px;
  height: 140px;
  display: block;
  object-fit: cover;
}
.avatar-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #fff;
  opacity: 0;
  transition: opacity 0.3s;
}
.mask-text {
  font-size: 12px;
  margin-top: 4px;
}
.avatar-container:hover .avatar-mask {
  opacity: 1;
}
.upload-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 8px;
}
.form-actions {
  margin-top: auto;
  padding: 24px 0;
  border-top: 1px solid var(--el-border-color-extra-light);
  text-align: center;
  background-color: var(--el-bg-color);
  z-index: 10;
}

/* 规格样式 */
.spec-section {
  margin-bottom: 30px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 20px;
  background-color: var(--el-fill-color-blank);
}
.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}
.section-title span {
  font-weight: 600;
  font-size: 16px;
}
.empty-spec {
  text-align: center;
  color: var(--el-text-color-secondary);
  padding: 30px 0;
  font-size: 14px;
}
.spec-group-item {
  background-color: var(--el-bg-color-page);
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 20px;
}
.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
.group-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.template-tag {
  flex-shrink: 0;
}
.lock-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: 10px;
}
.options-container {
  padding-left: 10px;
}
.add-option-btn {
  margin-top: 10px;
}
:deep(.el-table) {
  --el-table-border-color: var(--el-border-color-lighter);
}
:deep(.el-table th.el-table__cell) {
  background-color: var(--el-fill-color-light);
}

.submit-btn {
  padding-left: 40px;
  padding-right: 40px;
}
:deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--el-text-color-regular);
}
</style>
